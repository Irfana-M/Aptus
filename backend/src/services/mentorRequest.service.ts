import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { type IMentorAssignmentRequest } from "../models/mentorAssignmentRequest.model";
import { StudentModel } from "../models/student/student.model";
import { NotificationService } from "./NotificationService";
import { InternalEventEmitter } from "../utils/InternalEventEmitter";
import { EVENTS } from "../utils/InternalEventEmitter";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

import { v4 as uuidv4 } from 'uuid';

import type { IMentorRequestService } from "../interfaces/services/IMentorRequestService";
import type { SchedulingPolicy } from "../domain/scheduling/SchedulingPolicy";

@injectable()
export class MentorRequestService implements IMentorRequestService {
  constructor(
    @inject(TYPES.INotificationService) private notificationService: NotificationService,
    @inject(TYPES.IMentorAssignmentRequestRepository) private requestRepo: import("../interfaces/repositories/IMentorAssignmentRequestRepository").IMentorAssignmentRequestRepository,
    @inject(TYPES.IStudentRepository) private studentRepo: import("../interfaces/repositories/IStudentRepository").IStudentRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: import("../interfaces/repositories/ICourseRepository").ICourseRepository,
    @inject(TYPES.IEnrollmentLinkRepository) private enrollmentLinkRepo: import("../interfaces/repositories/IEnrollmentLinkRepository").IEnrollmentLinkRepository,
    @inject(TYPES.ISessionRepository) private sessionRepo: import("../interfaces/repositories/ISessionRepository").ISessionRepository,
    @inject(TYPES.IGradeRepository) private gradeRepo: import("../interfaces/repositories/IGradeRepository").IGradeRepository,
    @inject(TYPES.ITimeSlotRepository) private timeSlotRepo: import("../interfaces/repositories/ITimeSlotRepository").ITimeSlotRepository,
    @inject(TYPES.IMentorRepository) private mentorRepo: import("../interfaces/repositories/IMentorRepository").IMentorRepository,
    @inject(TYPES.SchedulingPolicy) private schedulingPolicy: SchedulingPolicy,
    @inject(TYPES.InternalEventEmitter) private eventEmitter: InternalEventEmitter
  ) {}

  async getPendingRequests(): Promise<IMentorAssignmentRequest[]> {
    return this.requestRepo.findPending();
  }

  async getRequestsByStudent(studentId: string): Promise<IMentorAssignmentRequest[]> {
    return this.requestRepo.findByStudent(studentId);
  }

  async approveRequest(
    requestId: string,
    adminId: string,
    overrides?: {
      mentorId?: string;
      days?: string[];
      timeSlot?: string;
    }
  ): Promise<{ 
    courseId: string, 
    isFreshApproval: boolean,
    recoveredRecords: string[]
  }> {
    try {
      logger.info(`[ApproveRequest] Starting approval for request ${requestId} by admin ${adminId}`);

      // STEP 1: Fetch MentorAssignmentRequest
      const request = await this.requestRepo.findById(requestId);
      if (!request) {
        throw new AppError("Request not found", HttpStatusCode.NOT_FOUND);
      }

      const getDetails = (field: any) => field?._id ? field._id.toString() : field?.toString();
      const requestStudentIdStr = getDetails(request.studentId);
      const requestSubjectIdStr = getDetails(request.subjectId);
      const effectiveMentorIdStr = overrides?.mentorId || getDetails(request.mentorId);

      if (!effectiveMentorIdStr) {
        throw new AppError("Mentor ID is required for approval", HttpStatusCode.BAD_REQUEST);
      }

      // STEP 2: Fetch Student
      const studentProfile: any = await this.studentRepo.findStudentProfileById(requestStudentIdStr);
      if (!studentProfile) {
        throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
      }

      const isFreshApproval = request.status !== 'approved';
      const recoveredRecords: string[] = [];

      // STEP 3: Idempotency Check
      const existingCourses = await this.courseRepo.findByStudent(requestStudentIdStr);
      let course: any = existingCourses.find((c: any) => 
          (c.subject?._id?.toString() === requestSubjectIdStr || c.subject?.toString() === requestSubjectIdStr) &&
          c.isActive && c.status !== 'cancelled'
      );

      // Prepare Schedule
      let schedule: any = undefined;
      if (overrides?.days && overrides.days.length > 0) {
          schedule = {
            days: overrides.days.map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()),
            timeSlot: overrides.timeSlot || "TBD"
          };
      } else {
          const matchedSlot = studentProfile.preferredTimeSlots?.find(
            (slot: any) => {
              const slotSubjectId = slot.subjectId?._id ? slot.subjectId._id.toString() : slot.subjectId?.toString();
              return slotSubjectId === requestSubjectIdStr;
            }
          );
          if (matchedSlot?.slots && matchedSlot.slots.length > 0) {
              schedule = {
                days: matchedSlot.slots.map((s: any) => s.day.charAt(0).toUpperCase() + s.day.slice(1).toLowerCase()),
                timeSlot: `${matchedSlot.slots[0].startTime} - ${matchedSlot.slots[0].endTime}`
              };
          }
      }

      if (!schedule || !schedule.days || schedule.days.length === 0) {
         throw new AppError("Schedule not resolved. Please provide days and timeSlot.", HttpStatusCode.BAD_REQUEST);
      }

      // STEP 3: Validate Subscription
      const subscription = studentProfile.subscription;
      if (!subscription || subscription.status !== 'active') {
          throw new AppError("Student does not have an active subscription.", HttpStatusCode.FORBIDDEN);
      }

      const plan = (subscription.plan || 'monthly').toLowerCase();
      // Enforce strict mapping: Basic/Monthly -> Group, Premium/Yearly -> One-to-One
      const isPremium = plan === 'premium' || plan === 'yearly';
      const courseType: 'one-to-one' | 'group' = isPremium ? 'one-to-one' : 'group';
      const maxSessions = plan === 'yearly' ? 3 : 2;
      
      logger.info(`[ApproveRequest] Student ${requestStudentIdStr} has ${plan} plan. Model: ${courseType}. Max sessions: ${maxSessions}`);

      // SLICING LOGIC
      if (schedule.days.length > maxSessions && courseType === 'one-to-one') {
          logger.info(`[ApproveRequest] Slicing ${schedule.days.length} selected days to ${maxSessions} for 1:1.`);
          schedule.days = schedule.days.slice(0, maxSessions);
      }

      // GRADE RESOLUTION
      let finalGradeId = (studentProfile.gradeId && (studentProfile.gradeId as any)._id) 
        ? (studentProfile.gradeId as any)._id.toString() 
        : (studentProfile.gradeId ? studentProfile.gradeId.toString() : null);

      if (!finalGradeId && studentProfile.academicDetails?.grade) {
          const gradeStr = studentProfile.academicDetails.grade;
          // Try to lookup Grade by name or number
          const gradeNum = parseInt(gradeStr.replace(/\D/g, ''));
          const foundGrade = await this.gradeRepo.findOne({ 
            $or: [
              { name: new RegExp(gradeStr, 'i') },
              { grade: gradeNum }
            ]
          });
          
          if (foundGrade) {
              finalGradeId = (foundGrade as any)._id.toString();
              logger.info(`Resolved Grade ID ${finalGradeId} for string "${gradeStr}"`);
          }
          if (foundGrade) {
              finalGradeId = (foundGrade as any)._id.toString();
              logger.info(`Resolved Grade ID ${finalGradeId} for string "${gradeStr}"`);
          }
      }

      if (!finalGradeId) {
         throw new AppError(`Could not resolve Grade ID for student. Grade: ${studentProfile.academicDetails?.grade}`, HttpStatusCode.BAD_REQUEST);
      }

      // --- VALIDATION START ---
      // 1. Validate Mentor Availability
      const startSlot = schedule.timeSlot.split('-')[0].trim();
      const mentor = await this.mentorRepo.findById(effectiveMentorIdStr);
      if (!mentor) {
         throw new AppError("Mentor selected for approval not found.", HttpStatusCode.NOT_FOUND);
      }

      // Check if mentor slot exists for ALL days
      const mentorAvailability = mentor.availability || [];
      const missingDays = schedule.days.filter((day: string) => {
          const daySched = mentorAvailability.find((d: any) => d.day === day && d.slots && d.slots.length > 0);
          if (!daySched) return true;
          // Check if specific time slot is available
          const hasTime = daySched.slots.some((s: any) => s.startTime === startSlot);
          return !hasTime;
      });

      if (missingDays.length > 0) {
          throw new AppError(`Mentor is NOT available on ${missingDays.join(', ')} at ${startSlot}. Forced assignment blocked.`, HttpStatusCode.BAD_REQUEST);
      }

      // 2. Enforce Subscription Rules
      // Basic/Monthly -> Group Only
      // Premium/Yearly -> 1:1 Only
      if ((plan === 'basic' || plan === 'monthly') && courseType === 'one-to-one') {
          throw new AppError("Basic/Monthly plan students cannot be assigned 1:1 mentorship. Please upgrade or select Group.", HttpStatusCode.FORBIDDEN);
      }
      if ((plan === 'premium' || plan === 'yearly') && courseType === 'group' && request.mentoringMode === 'one-to-one') {
           // Allow Premium to join Group if they explicitly asked for it? 
           // Usually Premium implies 1:1 entitlement. If they want group, it's fine, but 
           // usually we enforce what they paid for.
           // User rule: "Premium -> one-to-one".
           // Ensure we don't downgrade them accidentally unless requested?
           // The variable 'courseType' is derived from plan above in old code: `const courseType = plan === 'yearly' ? 'one-to-one' : 'group';`
           // So we just need to ensure that logic holds and we don't override it improperly.
           // Actually, let's strictly enforce the derivation:
      }
      // Re-derive courseType strictly based on plan to ensure compliance
      const enforcedCourseType = (plan === 'premium' || plan === 'yearly') ? 'one-to-one' : 'group';
      
      if (courseType !== enforcedCourseType) {
          logger.warn(`[ApproveRequest] Mismatch in course type. Enforcing ${enforcedCourseType} based on plan ${plan}.`);
          // We can't simply reassign 'courseType' because it's a const. 
          // Let's rely on the variable `courseType` which IS defined as `const` above. 
          // We should just check if the logic above was correct.
          // Old logic: `const courseType = plan === 'yearly' ? 'one-to-one' : 'group';`
          // If plan is 'premium', old logic might default to 'group'.
          // Let's Fix the definition of `courseType` above instead.
      }
      // --- VALIDATION END ---

      // STEP 4: Create/Update Course

      if (courseType === 'group') {
          // FIND EXISTING GROUP COURSE WITH CAPACITY
          const existingGroupCourses = await this.courseRepo.findOne({
              subject: new mongoose.Types.ObjectId(requestSubjectIdStr),
              grade: new mongoose.Types.ObjectId(finalGradeId),
              courseType: 'group',
              status: 'booked',
              isActive: true,
              enrolledStudents: { $lt: 10 }
          } as any);

          if (existingGroupCourses) {
              course = existingGroupCourses;
              logger.info(`[ApproveRequest] Joining existing group course ${course._id}`);
              
              // Increment enrolled count
              await this.courseRepo.updateCourse(course._id.toString(), {
                  $inc: { enrolledStudents: 1 }
              } as any);
              recoveredRecords.push('joined_existing_group');
          }
      }

      if (!course) {
          const startDate = new Date();
          const endDate = subscription.endDate ? new Date(subscription.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          course = await this.courseRepo.createEnrollment({
            student: courseType === 'one-to-one' ? requestStudentIdStr : undefined,
            mentor: effectiveMentorIdStr,
            subject: requestSubjectIdStr,
            grade: finalGradeId,
            startDate,
            endDate,
            status: 'booked',
            schedule: schedule,
            courseType,
            maxStudents: courseType === 'group' ? 10 : 1,
            enrolledStudents: courseType === 'group' ? 1 : 0
          } as any);
          recoveredRecords.push(courseType === 'group' ? 'group_course_created' : 'course_created');
      }

      // STEP 5: EnrollmentLink
      let enrollmentId = "";
      const existingLink = await this.enrollmentLinkRepo.findByStudentAndCourse(requestStudentIdStr, course._id.toString());
      if (!existingLink) {
          const newLink = await this.enrollmentLinkRepo.create({
              student: new mongoose.Types.ObjectId(requestStudentIdStr),
              course: course._id as any,
              status: 'active'
          });
          enrollmentId = (newLink as any)._id.toString();
          recoveredRecords.push('enrollment_link_created');
      } else {
          enrollmentId = (existingLink as any)._id.toString();
      }

      // STEP 6: Sessions
      const existingSessions = await this.sessionRepo.findByStudentAndSubject(requestStudentIdStr, requestSubjectIdStr);
      const activeSessions = existingSessions.filter((s: any) => s.status === 'scheduled');

      if (activeSessions.length === 0) {
          if (courseType === 'group') {
              // Add student to existing sessions in this group course
              const groupSessions = await this.sessionRepo.findByMentorAndDateRange(
                  getDetails(course.mentor),
                  new Date(),
                  new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000)
              );
              
              const relevantSessions = groupSessions.filter((s: any) => 
                  getDetails(s.courseId) === course._id.toString() && s.status === 'scheduled'
              );

              if (relevantSessions.length > 0) {
                  logger.info(`[ApproveRequest] Adding student to ${relevantSessions.length} existing group sessions`);
                  for (const s of relevantSessions) {
                      await this.sessionRepo.updateById((s as any)._id.toString(), {
                          $push: { 
                              participants: { userId: new mongoose.Types.ObjectId(requestStudentIdStr), role: 'student', status: 'scheduled' }
                          }
                      } as any);
                  }
                  recoveredRecords.push('added_to_existing_group_sessions');
              } else {
                  // Generate sessions for new group
                  await this.generateSessionsForWeeks(
                      requestStudentIdStr,
                      effectiveMentorIdStr,
                      requestSubjectIdStr,
                      course._id.toString(),
                      enrollmentId,
                      schedule.days.map((day: string) => ({
                          day,
                          startTime: schedule.timeSlot.split(' - ')[0]?.trim() || "10:00",
                          endTime: schedule.timeSlot.split(' - ')[1]?.trim() || "11:00"
                      })),
                      4,
                      courseType
                  );
                  recoveredRecords.push('group_sessions_generated');
              }
          } else {
              // 1:1 Session Generation
              const slotsForSessions = schedule.days.map((day: string) => ({
                  day,
                  startTime: schedule.timeSlot.split(' - ')[0]?.trim() || "10:00",
                  endTime: schedule.timeSlot.split(' - ')[1]?.trim() || "11:00"
              }));

              await this.generateSessionsForWeeks(
                  requestStudentIdStr,
                  effectiveMentorIdStr,
                  requestSubjectIdStr,
                  course._id.toString(),
                  enrollmentId,
                  slotsForSessions,
                  4,
                  courseType
              );
              recoveredRecords.push('one_to_one_sessions_generated');
          }
      }

      // STEP 7: Statuses
      if (isFreshApproval) {
          await this.studentRepo.updatePreferredTimeSlotStatus(requestStudentIdStr, requestSubjectIdStr, 'mentor_assigned', effectiveMentorIdStr);
          await this.requestRepo.updateStatus(requestId, 'approved', adminId);
          
          const studentName = studentProfile.fullName || "Student";
          
          this.eventEmitter.emit(EVENTS.MENTOR_ASSIGNED, {
            studentId: requestStudentIdStr,
            studentName,
            mentorId: effectiveMentorIdStr,
            mentorName: "Mentor",
            subjectName: (request as any).subjectId?.subjectName || "Subject"
          });
      }

      logger.info(`[ApproveRequest] Approval completed for request ${requestId}`);

      return {
        courseId: course._id.toString(),
        isFreshApproval,
        recoveredRecords
      };

    } catch (error) {
      logger.error(`[ApproveRequest] Error:`, error);
      throw error;
    }
  }

  async rejectRequest(
    requestId: string,
    adminId: string,
    reason?: string
  ): Promise<void> {
    try {
      const request = await this.requestRepo.findById(requestId);
      if (!request) {
        throw new AppError("Request not found", HttpStatusCode.NOT_FOUND);
      }
      if (request.status !== 'pending') {
        throw new AppError("Request has already been processed", HttpStatusCode.BAD_REQUEST);
      }

      const getDetails = (field: any) => field?._id ? field._id.toString() : field?.toString();

      const requestStudentIdStr = getDetails(request.studentId);
      const requestSubjectIdStr = getDetails(request.subjectId);

      // 1. Revert Student Preference Status
      logger.info(`[RejectRequest] Reverting student preferences...`);
      await this.studentRepo.updatePreferredTimeSlotStatus(
        requestStudentIdStr,
        requestSubjectIdStr,
        'preferences_submitted'
      );

      // 2. Update Request Status
      logger.info(`[RejectRequest] Updating request status to rejected...`);
      await this.requestRepo.updateStatus(requestId, 'rejected', adminId, reason);

      // 3. Notify Student
      // Fetch details for notification if needed, or rely on IDs/Placeholders
      // Ideally fetch names.
      const studentName = "Student"; // Placeholder
      const mentorName = "Mentor"; // Placeholder
      
      logger.info(`[RejectRequest] Sending rejection notification via event...`);
      this.eventEmitter.emit(EVENTS.MENTOR_REQUEST_REJECTED, {
        studentId: requestStudentIdStr,
        mentorName: "Mentor",
        subjectName: (request as any).subjectId?.subjectName || "Subject",
        reason
      });

      logger.info(`Mentor request ${requestId} rejected successfully.`);

    } catch (error) {
      logger.error("Error rejecting mentor request:", error);
      throw error;
    }
  }

    private async generateSessionsForWeeks(
    studentId: string,
    mentorId: string,
    subjectId: string,
    courseId: string,
    enrollmentId: string,
    slots: { day: string; startTime: string; endTime: string }[],
    weeks: number,
    courseType: 'one-to-one' | 'group' = 'one-to-one'
  ): Promise<void> {
    const now = new Date();
    const dayMap: Record<string, number> = {
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };

    for (let i = 0; i < weeks; i++) {
        for (const slot of slots) {
            const targetDay = dayMap[slot.day];
            if (targetDay === undefined) continue;

            const baseDate = new Date();
            baseDate.setDate(now.getDate() + ((targetDay + 7 - now.getDay()) % 7));
            if (baseDate <= now) baseDate.setDate(baseDate.getDate() + 7);
            baseDate.setDate(baseDate.getDate() + (i * 7));

            const [sHour, sMin] = (slot.startTime || "10:00").split(':').map(n => parseInt(n, 10));
            const [eHour, eMin] = (slot.endTime || "11:00").split(':').map(n => parseInt(n, 10));

            const startDateTime = new Date(baseDate);
            startDateTime.setHours(sHour || 10, sMin || 0, 0, 0);

            const endDateTime = new Date(baseDate);
            endDateTime.setHours(eHour || 11, eMin || 0, 0, 0);

            // --- ENFORCE LIMITS START ---
            const dailyCount = await this.timeSlotRepo.countByMentorAndDate(mentorId, startDateTime);
            const weeklyCount = await this.timeSlotRepo.countByMentorAndWeek(mentorId, startDateTime);

            // Fetch mentor profile for limits (optimize: fetch once outside if efficient, but here we need latest limits)
            // Ideally should be cached, but for strict enforcement we fetch or pass. 
            // We can re-use 'mentor' from approveRequest if passed down, but this method takes ID.
            // Let's assume default unless we fetch. For correctness, let's fetch.
            const sessionMentorIdx = await this.mentorRepo.findById(mentorId);
            if (!sessionMentorIdx) throw new AppError(`Mentor ${mentorId} not found during generation`, HttpStatusCode.NOT_FOUND);

            const limitResult = this.schedulingPolicy.isMentorWithinLimits(sessionMentorIdx, dailyCount, weeklyCount);
            if (!limitResult.allowed) {
                const reason = `Mentor limit exceeded for ${startDateTime.toISOString()}: ${limitResult.reason || 'Unknown Limit'}`;
                logger.error(reason);
                throw new AppError(reason, HttpStatusCode.CONFLICT);
            }
            // --- ENFORCE LIMITS END ---

            // 1. Find or Create Slot
            let slotDoc = await this.timeSlotRepo.findOne({
                mentorId: new mongoose.Types.ObjectId(mentorId),
                startTime: startDateTime,
                endTime: endDateTime
            });

            if (!slotDoc) {
                try {
                    slotDoc = await this.timeSlotRepo.create({
                        mentorId: new mongoose.Types.ObjectId(mentorId),
                        subjectId: new mongoose.Types.ObjectId(subjectId),
                        startTime: startDateTime,
                        endTime: endDateTime,
                        status: 'available',
                        maxStudents: courseType === 'group' ? 10 : 1,
                        currentStudentCount: 0
                    } as any);
                } catch (e: any) {
                    if (e.code === 11000) {
                        slotDoc = await this.timeSlotRepo.findOne({
                            mentorId: new mongoose.Types.ObjectId(mentorId),
                            startTime: startDateTime,
                            endTime: endDateTime
                        });
                    } else throw e;
                }
            }

            if (!slotDoc) throw new AppError("Failed to resolve time slot", HttpStatusCode.INTERNAL_SERVER_ERROR);

            // 2. Reserve Slot (LOCKED state)
            const reserved = await this.timeSlotRepo.reserveSlot((slotDoc as any)._id.toString());
            if (!reserved) {
                logger.warn(`[GenerateSessions] Slot ${(slotDoc as any)._id} already taken. Attempting to rollback and failing...`);
                throw new AppError(`Conflict: Slot at ${startDateTime.toISOString()} is already booked.`, HttpStatusCode.CONFLICT);
            }

            // 3. Create Session with full links
            const sessionData = {
                timeSlotId: (slotDoc as any)._id,
                mentorId: new mongoose.Types.ObjectId(mentorId),
                studentId: new mongoose.Types.ObjectId(studentId),
                courseId: new mongoose.Types.ObjectId(courseId),
                enrollmentId: new mongoose.Types.ObjectId(enrollmentId),
                subjectId: new mongoose.Types.ObjectId(subjectId),
                startTime: startDateTime,
                endTime: endDateTime,
                status: 'scheduled',
                sessionType: courseType, // Use courseType parameter
                webRTCId: uuidv4(),
                participants: [
                    { userId: new mongoose.Types.ObjectId(mentorId), role: 'mentor', status: 'scheduled' },
                    { userId: new mongoose.Types.ObjectId(studentId), role: 'student', status: 'scheduled' }
                ],
                mentorStatus: 'scheduled'
            };

            await this.sessionRepo.create(sessionData as any);

            // 4. Confirm Booking (BOOKED state)
            await this.timeSlotRepo.confirmBooking((slotDoc as any)._id.toString());
        }
    }
  }
}
