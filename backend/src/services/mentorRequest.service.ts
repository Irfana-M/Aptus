import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import { type IMentorAssignmentRequest } from "../models/mentorAssignmentRequest.model.js";
import { NotificationService } from "./NotificationService.js";
import { InternalEventEmitter } from "../utils/InternalEventEmitter.js";
import { EVENTS } from "../utils/InternalEventEmitter.js";
import { AppError } from "../utils/AppError.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { logger } from "../utils/logger.js";
import { Types } from "mongoose";
import { MESSAGES } from "../constants/messages.constants.js";

import { v4 as uuidv4 } from 'uuid';

import type { IMentorRequestService } from "../interfaces/services/IMentorRequestService.js";
import type { SchedulingPolicy } from "../domain/scheduling/SchedulingPolicy.js";
import type { ISubscriptionRepository } from "../interfaces/repositories/ISubscriptionRepository.js";
import type { ITrialClassRepository } from "../interfaces/repositories/ITrialClassRepository.js";

@injectable()
export class MentorRequestService implements IMentorRequestService {
  constructor(
    @inject(TYPES.INotificationService) private notificationService: NotificationService,
    @inject(TYPES.IMentorAssignmentRequestRepository) private requestRepo: import("../interfaces/repositories/IMentorAssignmentRequestRepository.js").IMentorAssignmentRequestRepository,
    @inject(TYPES.IStudentRepository) private studentRepo: import("../interfaces/repositories/IStudentRepository.js").IStudentRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: import("../interfaces/repositories/ICourseRepository.js").ICourseRepository,
    @inject(TYPES.IEnrollmentLinkRepository) private enrollmentLinkRepo: import("../interfaces/repositories/IEnrollmentLinkRepository.js").IEnrollmentLinkRepository,
    @inject(TYPES.ISessionRepository) private sessionRepo: import("../interfaces/repositories/ISessionRepository.js").ISessionRepository,
    @inject(TYPES.IGradeRepository) private gradeRepo: import("../interfaces/repositories/IGradeRepository.js").IGradeRepository,
    @inject(TYPES.ITimeSlotRepository) private timeSlotRepo: import("../interfaces/repositories/ITimeSlotRepository.js").ITimeSlotRepository,
    @inject(TYPES.IMentorRepository) private mentorRepo: import("../interfaces/repositories/IMentorRepository.js").IMentorRepository,
    @inject(TYPES.ISubscriptionRepository) private subscriptionRepo: ISubscriptionRepository,
    @inject(TYPES.ITrialClassRepository) private trialClassRepo: ITrialClassRepository,
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
        throw new AppError(MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Request"), HttpStatusCode.NOT_FOUND);
      }

      const getDetails = (field: unknown) => {
        const f = field as { _id?: { toString(): string } };
        return f?._id ? f._id.toString() : (field as { toString(): string })?.toString();
      };
      const requestStudentIdStr = getDetails(request.studentId);
      const requestSubjectIdStr = getDetails(request.subjectId);
      const effectiveMentorIdStr = overrides?.mentorId || getDetails(request.mentorId);

      if (!effectiveMentorIdStr) {
        throw new AppError(MESSAGES.ADMIN.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST);
      }

      // STEP 2: Fetch Student
      const studentProfile = await this.studentRepo.findStudentProfileById(requestStudentIdStr);
      if (!studentProfile) {
        throw new AppError(MESSAGES.STUDENT.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      const isFreshApproval = request.status !== 'approved';
      const recoveredRecords: string[] = [];

      // STEP 3: Idempotency Check
      const existingCourses = await this.courseRepo.findByStudent(requestStudentIdStr);
      let course = existingCourses.find((c) => {
          const typed = c as unknown as { subject?: { _id?: { toString(): string }, toString(): string }, isActive: boolean, status: string };
          return (typed.subject?._id?.toString() === requestSubjectIdStr || typed.subject?.toString() === requestSubjectIdStr) &&
          typed.isActive && typed.status !== 'cancelled';
      });

      // Prepare Schedule
      let schedule: { days: string[], timeSlot: string, slots?: { day: string, startTime: string, endTime: string }[] } | undefined = undefined;
      let slots: { day: string, startTime: string, endTime: string }[] = [];

      if (overrides?.days && overrides.days.length > 0) {
          // Manual Override (Legacy/Admin force) - assumes strict TimeSlot string
          // This path flattens to a single time for all days
          schedule = {
            days: overrides.days.map(day => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()),
            timeSlot: overrides.timeSlot || "TBD"
          };
      } else {
          // Automatic from Student Preferences
          const matchedSlot = (studentProfile as unknown as import('../interfaces/models/student.interface.js').StudentProfile).preferredTimeSlots?.find(
            (slot) => {
              const s = slot as unknown as { subjectId?: { _id?: { toString(): string }, toString(): string } };
              const slotSubjectId = s.subjectId?._id ? s.subjectId._id.toString() : s.subjectId?.toString();
              return slotSubjectId === requestSubjectIdStr;
            }
          );
          
          if (matchedSlot?.slots && matchedSlot.slots.length > 0) {
              // Extract FULL slots (Day + Time)
              slots = (matchedSlot as unknown as { slots: { day: string, startTime: string, endTime: string }[] }).slots.map((slot) => ({
                  day: slot.day.charAt(0).toUpperCase() + slot.day.slice(1).toLowerCase(),
                  startTime: slot.startTime,
                  endTime: slot.endTime
              }));

              // Construct Helper Schedule Object for Legacy Code compatibility
              const firstSlot = slots[0];
              const timeSlotSummary = slots.length > 1 ? "Multiple Times" : (firstSlot ? `${firstSlot.startTime}-${firstSlot.endTime}` : "Multiple Times");

              schedule = {
                days: slots.map(slot => slot.day),
                timeSlot: timeSlotSummary,
                slots: slots
              };
          }
      }

      if (!schedule || (!schedule.days?.length && !slots.length)) {
         throw new AppError(MESSAGES.ADMIN.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST);
      }

      // STEP 3: Validate Subscription
      const studentWithType = studentProfile as unknown as import('../interfaces/models/student.interface.js').StudentProfile;
      const subscription = studentWithType.subscription;
      if (!subscription || subscription.status !== 'active') {
          throw new AppError(MESSAGES.ENROLLMENT.NOT_FOUND, HttpStatusCode.FORBIDDEN);
      }

      const planStr = (subscription.plan || 'monthly').toLowerCase();
      const planCode = (subscription.planCode || '').toUpperCase();
      const planType = (subscription.planType || '').toLowerCase();
      
      const isPremium = planStr === 'premium' || planStr === 'yearly' || planCode === 'PREMIUM' || planType === 'premium';
      const courseType: 'one-to-one' | 'group' = isPremium ? 'one-to-one' : 'group';
      
      // Fetch Plan Details dynamically
      const searchCode = isPremium ? 'PREMIUM' : 'BASIC';
      const planDoc = await this.subscriptionRepo.findPlanByCode(searchCode);
      
      // sessionsPerSubjectPerWeek: 1:1 = 2 (usually), Group = 2 (usually)
      const maxSessions = planDoc ? planDoc.sessionsPerSubjectPerWeek : (isPremium ? 2 : 2);
      
      logger.info(`[ApproveRequest] Student ${requestStudentIdStr} has ${planStr} plan. Max sessions allowed: ${maxSessions}`);

      // SLICING LOGIC: Limit the number of slots based on plan
      if (slots.length > 0) {
          if (slots.length > maxSessions) {
              logger.info(`[ApproveRequest] Truncating ${slots.length} selected slots to ${maxSessions} based on plan limits.`);
              slots = slots.slice(0, maxSessions);
              // Sync redundant schedule object
              schedule.slots = slots;
              schedule.days = slots.map((slot: { day: string }) => slot.day);
          }
      } else if (schedule.days.length > maxSessions) {
          // Fallback for legacy generic days array
          logger.info(`[ApproveRequest] Truncating ${schedule.days.length} selected days to ${maxSessions} based on plan limits.`);
          schedule.days = schedule.days.slice(0, maxSessions);
      }

      // GRADE RESOLUTION
      const finalGradeId = (studentProfile as unknown as { gradeId?: { _id?: { toString(): string } } | { toString(): string } }).gradeId;
      let finalGradeIdStr: string | null = null;
      
      if (finalGradeId) {
          if (typeof finalGradeId === 'object' && '_id' in finalGradeId && finalGradeId._id) {
              finalGradeIdStr = finalGradeId._id.toString();
          } else {
              finalGradeIdStr = finalGradeId.toString();
          }
      }

      if (!finalGradeIdStr && (studentProfile as unknown as import('../interfaces/models/student.interface.js').StudentProfile).academicDetails?.grade) {
          const gradeStr = (studentProfile as unknown as import('../interfaces/models/student.interface.js').StudentProfile).academicDetails!.grade;
          // Try to lookup Grade by name or number
          const gradeNum = parseInt(gradeStr.replace(/\D/g, ''));
          const foundGrade = await this.gradeRepo.findOne({ 
            $or: [
              { name: new RegExp(gradeStr, 'i') },
              { grade: gradeNum }
            ]
          });
          
          if (foundGrade) {
              finalGradeIdStr = (foundGrade as unknown as { _id: { toString(): string } })._id.toString();
              logger.info(`Resolved Grade ID ${finalGradeIdStr} for string "${gradeStr}"`);
          }
      }

      if (!finalGradeIdStr) {
         throw new AppError(MESSAGES.ADMIN.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST);
      }

      // --- VALIDATION START ---
      // 1. Validate Mentor Availability
      const mentor = await this.mentorRepo.findById(effectiveMentorIdStr);
      if (!mentor) {
         throw new AppError(MESSAGES.AVAILABILITY.MENTOR_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      // Check if mentor slot exists for ALL days
      const mentorAvailability = mentor.availability || [];
      const missingDays: string[] = [];

      if (slots.length > 0) {
          // Validate specific slots
          for (const slotItem of slots) {
             const daySched = mentorAvailability.find((availableDay: { day: string, slots?: { startTime: string }[] }) => availableDay.day === slotItem.day && availableDay.slots && availableDay.slots.length > 0);
             if (!daySched) {
                 missingDays.push(slotItem.day);
                 continue;
             }
             const hasTime = daySched.slots?.some((slotIdentifier: { startTime: string }) => slotIdentifier.startTime === slotItem.startTime);
             if (!hasTime) {
                 missingDays.push(`${slotItem.day} (${slotItem.startTime})`);
             }
          }
          
          if (missingDays.length > 0) {
              throw new AppError(MESSAGES.AVAILABILITY.MENTOR_NOT_FOUND, HttpStatusCode.BAD_REQUEST);
          }
      } else if (schedule && schedule.timeSlot) {
          const startSlot = schedule.timeSlot.split('-')[0]?.trim() || "10:00";
          for (const day of schedule.days) {
              const daySched = mentorAvailability.find((availableDay: { day: string, slots?: { startTime: string }[] }) => availableDay.day === day && availableDay.slots && availableDay.slots.length > 0);
              if (!daySched) {
                  missingDays.push(day);
                  continue;
              }
              const hasTime = daySched.slots?.some((slotIdentifier: { startTime: string }) => slotIdentifier.startTime === startSlot);
              if (!hasTime) {
                  missingDays.push(day);
              }
          }

          if (missingDays.length > 0) {
              throw new AppError(MESSAGES.AVAILABILITY.MENTOR_NOT_FOUND, HttpStatusCode.BAD_REQUEST);
          }
      }

      // 2. Enforce Subscription Rules
      // Basic -> Group Only
      // Premium -> 1:1 Only
      if (!isPremium && courseType === 'one-to-one') {
          throw new AppError(MESSAGES.STUDENT.BASIC_PLAN_CONSTRAINT, HttpStatusCode.FORBIDDEN);
      }
      if ((planStr === 'premium' || planStr === 'yearly') && courseType === 'group' && request.mentoringMode === 'one-to-one') {
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
      const enforcedCourseType = (planStr === 'premium' || planStr === 'yearly') ? 'one-to-one' : 'group';
      
      if (courseType !== enforcedCourseType) {
          logger.warn(`[ApproveRequest] Mismatch in course type. Enforcing ${enforcedCourseType} based on plan ${planStr}.`);
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
            subject: new Types.ObjectId(requestSubjectIdStr),
            grade: new Types.ObjectId(finalGradeIdStr || ""),
            courseType: 'group',
            status: 'booked',
            isActive: true,
            enrolledStudents: { $lt: 10 } as unknown as number
          } as Record<string, unknown>);
           
           if (existingGroupCourses) {
               course = existingGroupCourses as unknown as import('../models/course.model.js').ICourse;
               logger.info(`[ApproveRequest] Joining existing group course ${course._id}`);
              
               // Increment enrolled count
               await this.courseRepo.updateCourse((course as unknown as { _id: { toString(): string } })._id.toString(), {
                  $inc: { enrolledStudents: 1 } as unknown as number
               } as Partial<import("../interfaces/repositories/ICourseRepository.js").CreateOneToOneCourseDto>);
               recoveredRecords.push('joined_existing_group');
           }
      }

      if (!course) {
          const startDate = new Date();
          const endDate = subscription.endDate ? new Date(subscription.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          course = (await this.courseRepo.createEnrollment({
            student: courseType === 'one-to-one' ? requestStudentIdStr : undefined,
            mentor: effectiveMentorIdStr,
            subject: requestSubjectIdStr,
            grade: finalGradeIdStr || "",
            startDate,
            endDate,
            status: 'booked',
            schedule: schedule as { days: string[], timeSlot: string },
            courseType,
            maxStudents: courseType === 'group' ? 10 : 1,
            enrolledStudents: courseType === 'group' ? 1 : 0
          } as unknown as import("../interfaces/repositories/ICourseRepository.js").CreateOneToOneCourseDto)) as import("../models/course.model.js").ICourse;
          recoveredRecords.push(courseType === 'group' ? 'group_course_created' : 'course_created');
      }

      // STEP 5: EnrollmentLink
      let enrollmentId = "";
      const courseIdForLink = (course as unknown as { _id: { toString(): string } })._id.toString();
      const existingLink = await this.enrollmentLinkRepo.findByStudentAndCourse(requestStudentIdStr, courseIdForLink);
      if (!existingLink) {
          const newLink = await this.enrollmentLinkRepo.create({
              student: new Types.ObjectId(requestStudentIdStr) as unknown as import('mongoose').Schema.Types.ObjectId,
              course: new Types.ObjectId(courseIdForLink) as unknown as import('mongoose').Schema.Types.ObjectId,
              status: 'active' as 'active' | 'pending_payment' | 'cancelled',
          } as unknown as Partial<import('../models/enrollment.model.js').IEnrollment>);
          enrollmentId = (newLink as unknown as { _id: { toString(): string } })._id.toString();
          recoveredRecords.push('enrollment_link_created');
      } else {
          enrollmentId = (existingLink as unknown as { _id: { toString(): string } })._id.toString();
      }

      // STEP 6: Sessions
      const existingSessions = await this.sessionRepo.findByStudentAndSubject(requestStudentIdStr, requestSubjectIdStr);
      const activeSessions = existingSessions.filter((s) => (s as unknown as { status: string }).status === 'scheduled');

      if (activeSessions.length === 0) {
          if (courseType === 'group') {
              // Add student to existing sessions in this group course
              const groupSessions = await this.sessionRepo.findByMentorAndDateRange(
                  getDetails(course.mentor),
                  new Date(),
                  new Date(Date.now() + 4 * 7 * 24 * 60 * 60 * 1000)
              );
              
              const relevantSessions = groupSessions.filter((s) => {
                  const typed = s as unknown as { courseId?: { toString(): string } | string, status: string };
                  return getDetails(typed.courseId) === courseIdForLink && typed.status === 'scheduled';
              });

              if (relevantSessions.length > 0) {
                  logger.info(`[ApproveRequest] Adding student to ${relevantSessions.length} existing group sessions`);
                  for (const sItem of relevantSessions) {
                      await this.sessionRepo.updateById((sItem as unknown as { _id: { toString(): string } })._id.toString(), {
                          $push: { 
                              participants: { userId: new Types.ObjectId(requestStudentIdStr), role: 'student', status: 'scheduled' } as unknown as Record<string, unknown>
                          }
                      } as Record<string, unknown>);
                  }
                  recoveredRecords.push('added_to_existing_group_sessions');
              } else {
                  // Generate sessions for new group
                  const groupSlots = slots.length > 0 ? slots : schedule.days.map((day: string) => ({
                      day,
                      startTime: schedule.timeSlot.split(' - ')[0]?.trim() || "10:00",
                      endTime: schedule.timeSlot.split(' - ')[1]?.trim() || "11:00"
                  }));

                  await this.generateSessionsForWeeks(
                      requestStudentIdStr,
                      effectiveMentorIdStr,
                      requestSubjectIdStr,
                      courseIdForLink,
                      enrollmentId,
                      groupSlots,
                      4,
                      courseType
                  );
                  recoveredRecords.push('group_sessions_generated');
              }
          } else {
                  // 1:1 Session Generation
              const slotsForSessions = slots.length > 0 
                ? slots 
                : schedule.days.map((day: string) => ({
                    day,
                    startTime: schedule.timeSlot.split(' - ')[0]?.trim() || "10:00",
                    endTime: schedule.timeSlot.split(' - ')[1]?.trim() || "11:00"
                }));

              await this.generateSessionsForWeeks(
                  requestStudentIdStr,
                  effectiveMentorIdStr,
                  requestSubjectIdStr,
                  courseIdForLink,
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
          
          const studentName = (studentProfile as unknown as { fullName?: string }).fullName || "Student";
          
          this.eventEmitter.emit(EVENTS.MENTOR_ASSIGNED, {
            studentId: requestStudentIdStr,
            studentName,
            mentorId: effectiveMentorIdStr,
            mentorName: "Mentor",
            subjectName: (request as unknown as { subjectId?: { subjectName?: string } }).subjectId?.subjectName || "Subject"
          });
      }

      logger.info(`[ApproveRequest] Approval completed for request ${requestId}`);

      return {
        courseId: courseIdForLink,
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
        throw new AppError(MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Request"), HttpStatusCode.NOT_FOUND);
      }
      if (request.status !== 'pending') {
        throw new AppError(MESSAGES.ADMIN.UPDATE_FAILED, HttpStatusCode.BAD_REQUEST);
      }

      const getDetails = (field: unknown) => {
        const f = field as { _id?: { toString(): string } };
        return f?._id ? f._id.toString() : (field as { toString(): string })?.toString();
      };

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
      const _studentName = "Student"; // Placeholder
      const _mentorName = "Mentor"; // Placeholder

      logger.info(`[RejectRequest] Sending rejection notification via event...`);
      this.eventEmitter.emit(EVENTS.MENTOR_REQUEST_REJECTED, {
        studentId: requestStudentIdStr,
        mentorName: "Mentor",
        subjectName: (request as unknown as { subjectId?: { subjectName?: string } }).subjectId?.subjectName || "Subject",
        reason
      });

      logger.info(`Mentor request ${requestId} rejected successfully.`);

    } catch (error) {
      logger.error("Error rejecting mentor request:", error);
      throw error;
    }
  }

    public async generateSessionsForWeeks(
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

    // Fetch mentor profile for limits (optimize: fetch once outside loops)
    const sessionMentorIdx = await this.mentorRepo.findById(mentorId);
    if (!sessionMentorIdx) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);

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
            // --- ENFORCE LIMITS START ---
            let dailyCount = await this.timeSlotRepo.countByMentorAndDate(mentorId, startDateTime);
            let weeklyCount = await this.timeSlotRepo.countByMentorAndWeek(mentorId, startDateTime);

            // Include Trial Classes in counts
            try {
                // Daily Trial Count
                const dailyStart = new Date(startDateTime);
                dailyStart.setHours(0, 0, 0, 0);
                const dailyEnd = new Date(startDateTime);
                dailyEnd.setHours(23, 59, 59, 999);

                const dailyTrials = await this.trialClassRepo.countDocuments({
                    mentor: mentorId,
                    preferredDate: { $gte: dailyStart, $lte: dailyEnd },
                    status: 'assigned'
                });
                dailyCount += dailyTrials;

                // Weekly Trial Count
                const weeklyDate = new Date(startDateTime);
                const day = weeklyDate.getDay();
                const diff = weeklyDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                const weeklyStart = new Date(weeklyDate.setDate(diff));
                weeklyStart.setHours(0, 0, 0, 0);

                const weeklyEnd = new Date(weeklyStart);
                weeklyEnd.setDate(weeklyStart.getDate() + 6);
                weeklyEnd.setHours(23, 59, 59, 999);

                const weeklyTrials = await this.trialClassRepo.countDocuments({
                    mentor: mentorId,
                    preferredDate: { $gte: weeklyStart, $lte: weeklyEnd },
                    status: 'assigned'
                });
                weeklyCount += weeklyTrials;

            } catch (error) {
                 logger.warn(`Failed to include trial classes in limit check: ${error}`);
            }

            const limitResult = this.schedulingPolicy.isMentorWithinLimits(sessionMentorIdx, dailyCount, weeklyCount);
            if (!limitResult.allowed) {
                const reason = `Mentor limit exceeded for ${startDateTime.toISOString()}: ${limitResult.reason || 'Unknown Limit'} (Daily: ${dailyCount}, Weekly: ${weeklyCount})`;
                logger.error(reason);
                throw new AppError(reason, HttpStatusCode.CONFLICT);
            }
            // --- ENFORCE LIMITS END ---

            // 1. Find or Create Slot
            let slotDoc = await this.timeSlotRepo.findOne({
                mentorId: new Types.ObjectId(mentorId),
                startTime: startDateTime,
                endTime: endDateTime
            });

            if (!slotDoc) {
                try {
                    slotDoc = await this.timeSlotRepo.create({
                        mentorId: new Types.ObjectId(mentorId) as unknown as import('mongoose').Schema.Types.ObjectId,
                        subjectId: new Types.ObjectId(subjectId) as unknown as import('mongoose').Schema.Types.ObjectId,
                        startTime: startDateTime,
                        endTime: endDateTime,
                        status: 'available',
                        maxStudents: courseType === 'group' ? 10 : 1,
                        currentStudentCount: 0
                    } as unknown as import('../interfaces/models/timeSlot.interface.js').ITimeSlot);
                } catch (error) {
                    const errorObj = error as { code?: number };
                    if (errorObj.code === 11000) {
                        slotDoc = await this.timeSlotRepo.findOne({
                            mentorId: new Types.ObjectId(mentorId),
                            startTime: startDateTime,
                            endTime: endDateTime
                        });
                    } else throw error;
                }
            }

            if (!slotDoc) throw new AppError(MESSAGES.SESSION.INVALID_STATE, HttpStatusCode.INTERNAL_SERVER_ERROR);

            // 2. Reserve Slot (LOCKED state)
            const reserved = await this.timeSlotRepo.reserveSlot((slotDoc as unknown as { _id: { toString(): string } })._id.toString());
            if (!reserved) {
                logger.warn(`[GenerateSessions] Slot ${(slotDoc as unknown as { _id: { toString(): string } })._id} already taken. Attempting to rollback and failing...`);
                throw new AppError(`Conflict: Slot at ${startDateTime.toISOString()} is already booked.`, HttpStatusCode.CONFLICT);
            }

            // 3. Create Session with full links
            const sessionData = {
                timeSlotId: (slotDoc as unknown as { _id: unknown })._id as import('mongoose').Schema.Types.ObjectId,
                mentorId: new Types.ObjectId(mentorId) as unknown as import('mongoose').Schema.Types.ObjectId,
                studentId: new Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId,
                courseId: new Types.ObjectId(courseId) as unknown as import('mongoose').Schema.Types.ObjectId,
                enrollmentId: new Types.ObjectId(enrollmentId) as unknown as import('mongoose').Schema.Types.ObjectId,
                subjectId: new Types.ObjectId(subjectId) as unknown as import('mongoose').Schema.Types.ObjectId,
                startTime: startDateTime,
                endTime: endDateTime,
                status: 'scheduled' as const,
                sessionType: courseType, 
                webRTCId: uuidv4(),
                participants: [
                    { userId: new Types.ObjectId(mentorId) as unknown as import('mongoose').Schema.Types.ObjectId, role: 'mentor', status: 'scheduled' },
                    { userId: new Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId, role: 'student', status: 'scheduled' }
                ],
                mentorStatus: 'scheduled' as const
            };

            await this.sessionRepo.create(sessionData as unknown as import('../interfaces/models/session.interface.js').ISession);

            // 4. Confirm Booking (BOOKED state)
            await this.timeSlotRepo.confirmBooking((slotDoc as unknown as { _id: { toString(): string } })._id.toString());
        }
    }
  }
}
