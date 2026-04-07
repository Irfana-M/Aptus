import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { ISubjectRepository } from "../interfaces/repositories/ISubjectRepository";
import { AvailableMentorDto } from "../dtos/mentor/AvailableMentorDTO";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import type { ICourseAdminService } from "../interfaces/services/ICourseAdminService";
import type { ICourseRepository } from "../interfaces/repositories/ICourseRepository";
import type { GradeResponseDto } from "../dtos/student/grade.dto";
import type { SubjectResponseDto } from "../dtos/student/subject.dto";
import type { ISubjectService } from "../interfaces/services/ISubjectService";
import type { IGradeService } from "../interfaces/services/IGradeService";
import type { CoursePaginationParams, PaginatedResponse } from "../dtos/shared/paginationTypes";
import { logger } from "../utils/logger";
import { MESSAGES } from "../constants/messages.constants";
import type { IAvailabilityService } from "../interfaces/services/IAvailabilityService";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import type { CreateCourseParams } from "../interfaces/services/ICourseAdminService";
import type { IEnrollmentRepository } from "../interfaces/repositories/IEnrollmentRepository";
import type { IEnrollmentLinkRepository } from "../interfaces/repositories/IEnrollmentLinkRepository";
import type { INotificationService } from "../interfaces/services/INotificationService";
import type { ISchedulingService } from "../interfaces/services/ISchedulingService";
import type { ISessionService } from "../interfaces/services/ISessionService";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository";
import type { IMentorRequestService } from "../interfaces/services/IMentorRequestService";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository";
import type { IPaymentRepository } from "../interfaces/repositories/IPaymentRepository";
import type { ISubscriptionRepository } from "../interfaces/repositories/ISubscriptionRepository";
import { Types } from "mongoose";

@injectable()
export class CourseAdminService implements ICourseAdminService {
  constructor(
    @inject(TYPES.IMentorRepository) private mentorRepo: IMentorRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: ICourseRepository,
    @inject(TYPES.ISubjectService) private subjectService: ISubjectService,
    @inject(TYPES.IGradeService) private gradeService: IGradeService,
    @inject(TYPES.IAvailabilityService) private availabilityService: IAvailabilityService,
    @inject(TYPES.IEnrollmentRepository) private enrollmentRepo: IEnrollmentRepository,
    @inject(TYPES.IEnrollmentLinkRepository) private enrollmentLinkRepo: IEnrollmentLinkRepository,
    @inject(TYPES.INotificationService) private notificationService: INotificationService,
    @inject(TYPES.ISchedulingService) private schedulingService: ISchedulingService,
    @inject(TYPES.ISessionService) private sessionService: ISessionService,
    @inject(TYPES.ITimeSlotRepository) private timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.IMentorRequestService) private mentorRequestService: IMentorRequestService,
    @inject(TYPES.ISessionRepository) private sessionRepo: ISessionRepository,
    @inject(TYPES.ISubjectRepository) private _subjectRepo: ISubjectRepository,
    @inject(TYPES.IPaymentRepository) private paymentRepo: IPaymentRepository,
    @inject(TYPES.ISubscriptionRepository) private subscriptionRepo: ISubscriptionRepository
  ) {}

  /** Fetches the max students allowed in a group session from the DB plan. */
  private async _getMaxGroupStudents(): Promise<number> {
    const planDoc = await this.subscriptionRepo.findPlanByCode('BASIC');
    return planDoc?.maxStudentsAllowed ?? 5; // Fallback to 5 if plan not found
  }


  async getAvailableMentorsForCourse(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
    days?: string[];
    excludeCourseId?: string;
  }): Promise<{ matches: AvailableMentorDto[], alternates: AvailableMentorDto[] }> {
    // 1. Robustly resolve Subject
    let subjectDoc = null;
    if (params.subjectId && /^[0-9a-fA-F]{24}$/.test(params.subjectId)) {
        subjectDoc = await this._subjectRepo.findById(params.subjectId);
    } else if (params.subjectId) {
        subjectDoc = await this._subjectRepo.findOne({ subjectName: params.subjectId });
    }
    
    if (!subjectDoc) {
        throw new AppError(MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Subject"), HttpStatusCode.NOT_FOUND);
    }

    // 2. Robustly resolve Grade ID (needed for availabilityService)
    let resolvedGradeId = params.gradeId;
    if (params.gradeId && !/^[0-9a-fA-F]{24}$/.test(params.gradeId)) {
        const resolvedGradeIdFromModel = await this.gradeService.findByName(params.gradeId);
        if (resolvedGradeIdFromModel) {
            resolvedGradeId = resolvedGradeIdFromModel;
        } else {
             throw new AppError(MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Grade"), HttpStatusCode.NOT_FOUND);
        }
    }

    // Normalize params
    const days = params.days || (params.dayOfWeek !== undefined ? [this.getDayName(params.dayOfWeek)] : []);
    const timeSlot = params.timeSlot || "";

    const { matches, alternates } = await this.availabilityService.findMatchingMentors(
       (subjectDoc as any)._id.toString(),
       resolvedGradeId || "", // Ensure it's never undefined
       days,
       timeSlot,
       params.excludeCourseId
    );

    return {
        matches: matches.map((mentorItem: MentorProfile) => new AvailableMentorDto(mentorItem, (subjectDoc as any).subjectName)),
        alternates: alternates.map((mentorItem: MentorProfile) => new AvailableMentorDto(mentorItem, (subjectDoc as any).subjectName))
    };
  }

  private getDayName(dayIndex: number): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex] || "";
  }

  async createEnrollment(data: CreateCourseParams) {
    // 1. Resolve Subject ID if name provided
    let subjectId = data.subjectId;
    if (subjectId && !/^[0-9a-fA-F]{24}$/.test(subjectId)) {
        const subjectDoc = await this._subjectRepo.findOne({ subjectName: subjectId });
        if (subjectDoc) {
            subjectId = (subjectDoc._id as any).toString();
        } else {
             throw new AppError(MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Subject"), HttpStatusCode.NOT_FOUND);
        }
    } else if (subjectId) {
        const subjectDoc = await this._subjectRepo.findById(subjectId);
        if (!subjectDoc) throw new AppError(MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Subject"), HttpStatusCode.NOT_FOUND);
    }

    // 2. Resolve Grade ID if name provided
    let gradeId = data.gradeId;
    if (gradeId && !/^[0-9a-fA-F]{24}$/.test(gradeId)) {
        const resolvedId = await this.gradeService.findByName(gradeId);
        if (resolvedId) {
            gradeId = resolvedId;
        } else {
             throw new AppError(MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Grade"), HttpStatusCode.NOT_FOUND);
        }
    }

    // Check for conflicts ONLY if day and time are provided (Legacy) or schedule is provided
    let days: string[] = [];
    let timeSlot = "";

    if (data.schedule) {
       days = data.schedule.days;
       timeSlot = data.schedule.timeSlot;
    } else if (data.dayOfWeek !== undefined) {
       const dayName = this.getDayName(data.dayOfWeek);
       if (dayName) days.push(dayName);
       
       if (data.timeSlot) {
           timeSlot = data.timeSlot;
       }
    }

    // New logic: Check for existing group course to join
    if (data.courseType === 'group') {
        const existingGroupCourse = await this.courseRepo.findMatchingGroupCourse({
            mentorId: data.mentorId,
            subjectId: subjectId || "",
            gradeId: gradeId || "",
            days: days,
            timeSlot: timeSlot
        });

        if (existingGroupCourse) {
            logger.info(`Found existing group course ${existingGroupCourse._id} for enrollment`);
            
            // Check capacity against DB-driven limit
            const currentCount = existingGroupCourse.enrolledStudents || 0;
            const max = existingGroupCourse.maxStudents || (await this._getMaxGroupStudents());
            
            if (currentCount < max) {
                 logger.info(`Joining student ${data.studentId} to existing group course ${existingGroupCourse._id} (${currentCount}/${max})`);
                  if (data.studentId) {
                      await this.enrollStudentToCourse((existingGroupCourse._id as unknown as { toString(): string }).toString(), data.studentId);
                  }
                 return existingGroupCourse;
            } else {
                 logger.warn(`Existing group course ${existingGroupCourse._id} is full (${currentCount}/${max}). Creating new overflow course.`);
                 // Fall through to create new course logic
            }
        }
    }

    // Determine maxStudents from DB plan
    let maxStudents: number;
    if (data.courseType === 'one-to-one') {
        maxStudents = 1;
    } else {
        maxStudents = data.maxStudents || (await this._getMaxGroupStudents());
    }

    if (days.length > 0 && timeSlot) {
        await this.availabilityService.bookSlots(data.mentorId, days, timeSlot, maxStudents);
    }
    
    // Construct schedule object for model if creating from legacy params
    const schedule = data.schedule || {
        days: days,
        timeSlot: timeSlot
    };

    const course = await this.courseRepo.createEnrollment({
      ...data,
      mentor: data.mentorId,
      student: data.studentId, 
      subject: subjectId,
      grade: gradeId,
      courseType: data.courseType || "one-to-one",
      maxStudents: maxStudents, 
      status: "booked", 
      schedule: schedule, 
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    if (!course) {
        throw new AppError(MESSAGES.ADMIN.CREATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    // Increment mentor's weekly bookings since status is "booked"
    if (data.mentorId) {
      await this.mentorRepo.incrementWeeklyBookings(data.mentorId);
    }

    // If a student is assigned, also create an enrollment record
    if (data.studentId) {
       try {
           logger.info(`Creating enrollment record for student ${data.studentId} in course ${course._id}`);
           await this.enrollmentLinkRepo.create({
               student: data.studentId as any,
               course: (course._id as any).toString(),
               status: 'active' as any,
           } as any); 
           logger.info(`Enrollment record SUCCESS for student ${data.studentId}`);
       } catch (error) {
           logger.error(`Failed to create enrollment record for student ${data.studentId} in course ${course._id}:`, error);
       }
    }

    // Send notifications to student and mentor
    const subjectDoc = subjectId ? await this._subjectRepo.findById(subjectId) : null;
    const subjectName = (subjectDoc as any)?.subjectName || 'Course';

    try {
        const scheduleInfo = schedule.days && schedule.timeSlot 
            ? `on ${schedule.days.join(', ')} at ${schedule.timeSlot}`
            : '';

        // Notify Student (if assigned)
        if (data.studentId) {
            await this.notificationService.createNotification(
                data.studentId,
                'student',
                'mentor_assigned',
                'New Course Assigned',
                `You have been enrolled in ${subjectName} ${scheduleInfo}. Your course starts on ${new Date(data.startDate).toLocaleDateString()}.`,
                { courseId: course._id, subjectName, schedule }
            );
            logger.info(`Sent course creation notification to student ${data.studentId}`);
        }

        // Notify Mentor
        if (data.mentorId) {
            const studentInfo = data.studentId ? 'with assigned student' : 'is now available for enrollment';
            await this.notificationService.createNotification(
                data.mentorId,
                'mentor',
                'mentor_assigned',
                'New Course Created',
                `A new ${subjectName} course ${studentInfo} ${scheduleInfo}. Course starts on ${new Date(data.startDate).toLocaleDateString()}.`,
                { courseId: course._id, subjectName, schedule, studentId: data.studentId }
            );
            logger.info(`Sent course creation notification to mentor ${data.mentorId}`);
        }
    } catch (notificationError) {
        logger.error(`Failed to send course creation notifications:`, notificationError);
    }

    // CREATE PAYMENT RECORD FOR FINANCIAL VISIBILITY
    if (data.studentId) {
        await this._createAdminPaymentRecord(data.studentId, data.fee || 0, `Registration: ${subjectName}`);
    }

    // Generate Sessions directly (modern path) if student and schedule are provided
    if (data.studentId && data.mentorId && subjectId && schedule.days?.length > 0 && schedule.timeSlot) {
      try {
        const enrollmentLink = await this.enrollmentLinkRepo.findOne({
          student: data.studentId as any,
          course: (course._id as any).toString() as any
        });
        const enrollmentId = (enrollmentLink as any)?._id?.toString() || (course._id as any).toString();

        const parsedSlots = this._parseScheduleToSlots(schedule.days, schedule.timeSlot);
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const durationMs = endDate.getTime() - startDate.getTime();
        const weeks = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7)));

        logger.info(`[CourseAdmin] Generating sessions for ${weeks} weeks for course ${course._id}`);
        await this.mentorRequestService.generateSessionsForWeeks(
          data.studentId,
          data.mentorId,
          subjectId,
          (course._id as any).toString(),
          enrollmentId,
          parsedSlots,
          weeks,
          (data.courseType || 'one-to-one') as 'one-to-one' | 'group'
        );
        logger.info(`[CourseAdmin] Session generation complete for course ${course._id}`);
      } catch (sessionGenError) {
        logger.error(`[CourseAdmin] Failed to generate sessions for course ${course._id}:`, sessionGenError);
        // Non-fatal: course and enrollment exist; admin can retry via update
      }
    }

    return course;
  }

  async updateOneToOneCourse(id: string, data: Partial<CreateCourseParams>) {
    // 0. Fetch existing course
    const existingCourse = await this.courseRepo.findById(id);
    if (!existingCourse) {
      throw new AppError(MESSAGES.ADMIN.COURSE_NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // 1. Resolve IDs
    let subjectId = data.subjectId;
    if (subjectId && !/^[0-9a-fA-F]{24}$/.test(subjectId)) {
      const resolvedId = await this.subjectService.findByName(subjectId);
      if (resolvedId) subjectId = resolvedId;
    }

    let gradeId = data.gradeId;
    if (gradeId && !/^[0-9a-fA-F]{24}$/.test(gradeId)) {
      const resolvedId = await this.gradeService.findByName(gradeId);
      if (resolvedId) gradeId = resolvedId;
    }

    // 2. Detect changes
    const oldMentorId = existingCourse.mentor?._id?.toString() || (typeof existingCourse.mentor === 'string' ? existingCourse.mentor : null);
    const newMentorId = data.mentorId || oldMentorId;
    const mentorChanged = oldMentorId !== newMentorId;

    const oldSchedule = existingCourse.schedule || { days: [], timeSlot: "" };
    const newSchedule = data.schedule || oldSchedule;
    
    // Normalize days for comparison
    const oldDaysSorted = [...(oldSchedule.days || [])].sort();
    const newDaysSorted = [...(newSchedule.days || [])].sort();
    
    const scheduleChanged = 
      JSON.stringify(oldDaysSorted) !== JSON.stringify(newDaysSorted) ||
      oldSchedule.timeSlot !== newSchedule.timeSlot;

    logger.info(`Course ${id} update - Mentor changed: ${mentorChanged}, Schedule changed: ${scheduleChanged}`);

    // --- ATOMIC UPDATE LOGIC ---

    // 3. If significant changes, RELEASE OLD RESOURCES
    if (mentorChanged || scheduleChanged) {
        // A. Release Legacy Availability (Profile Array)
        if (oldMentorId && oldSchedule.days?.length > 0 && oldSchedule.timeSlot) {
            try {
                await this.availabilityService.releaseSlots(oldMentorId, oldSchedule.days, oldSchedule.timeSlot);
            } catch (error) {
                logger.error(`Failed to release legacy slots:`, error);
            }
        }

        // B. Release Modern TimeSlots & Delete Future Sessions
        const now = new Date();
        const futureSessions = await this.sessionRepo.find({ 
            courseId: existingCourse._id,
            startTime: { $gt: now } as unknown as Date,
            status: { $in: ['scheduled'] } as unknown as string[]
        } as Record<string, unknown>);

        if (futureSessions.length > 0) {
            // Release TimeSlots
            for (const sessionItem of futureSessions) {
                const s = sessionItem as unknown as { timeSlotId: { _id?: { toString(): string }, toString(): string } };
                const timeSlotId = s.timeSlotId?._id?.toString() || s.timeSlotId?.toString();
                if (timeSlotId) {
                     const slot = await this.timeSlotRepo.findById(timeSlotId);
                     if (slot) {
                        const newCount = Math.max(0, (slot.currentStudentCount || 1) - 1);
                        await this.timeSlotRepo.updateById(timeSlotId, {
                            currentStudentCount: newCount,
                            status: newCount === 0 ? 'available' : slot.status
                        } as Partial<import("../interfaces/models/timeSlot.interface").ITimeSlot>);
                     }
                }
            }
            // Delete Sessions
            const sessionIds = futureSessions.map((s) => (s as unknown as { _id: unknown })._id);
            await this.sessionRepo.deleteMany({ _id: { $in: sessionIds } });
            logger.info(`Deleted ${futureSessions.length} future sessions for regeneration`);
        }
    }

    // 4. Update Course Document
    const updateData: Record<string, unknown> = { ...data };
    if (subjectId) { updateData.subject = subjectId; delete updateData.subjectId; }
    if (gradeId) { updateData.grade = gradeId; delete updateData.gradeId; }
    if (data.mentorId) { updateData.mentor = data.mentorId; delete updateData.mentorId; }
    if (data.studentId) { updateData.student = data.studentId; delete updateData.studentId; }
    else if (data.studentId === null || data.studentId === "") { updateData.student = null; delete updateData.studentId; }
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    const updated = await this.courseRepo.updateCourse(id, updateData);
    if (!updated) throw new AppError(MESSAGES.ADMIN.COURSE_NOT_FOUND, HttpStatusCode.NOT_FOUND);

    // 5. If significant changes, BOOK NEW RESOURCES & REGENERATE
    if ((mentorChanged || scheduleChanged) && newMentorId && newSchedule.days?.length > 0 && newSchedule.timeSlot) {
        // A. Book Legacy Availability
        try {
            const maxStudents = data.courseType === 'one-to-one' ? 1 : (data.maxStudents || existingCourse.maxStudents || (await this._getMaxGroupStudents()));
            await this.availabilityService.bookSlots(newMentorId, newSchedule.days, newSchedule.timeSlot, maxStudents);
        } catch (error) {
            logger.error(`Failed to book new legacy slots:`, error);
        }

        // B. Regenerate Future Sessions (Modern System)
        // Extract Start/End times
        const formatTimePart = (timePart: string) => {
             if (!timePart) return "00:00";
             const [cleanTime, mod] = timePart.trim().split(' ');
             const cleanTimeArr = (cleanTime || "00:00").split(':').map(Number);
             let h = cleanTimeArr[0];
             const m = cleanTimeArr[1];
             if (mod) {
                 if (mod.toLowerCase() === 'pm' && (h || 0) < 12) h = (h || 0) + 12;
                 if (mod.toLowerCase() === 'am' && (h || 0) === 12) h = 0;
             }
             return `${(h || 0).toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
        };
        const [startRaw, endRaw] = newSchedule.timeSlot.split('-').map(part => part.trim());
        const startTimeStr = formatTimePart(startRaw || "00:00");
        const endTimeStr = formatTimePart(endRaw || "00:00");

        const newSlots = newSchedule.days.map((day: string) => ({
            day: day,
            startTime: startTimeStr,
            endTime: endTimeStr
        }));

        // Calculate Weeks
        const now = new Date();
        const endDate = new Date(updated.endDate);
        const durationMs = endDate.getTime() - now.getTime();
        const remainingWeeks = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7)));

        // Find active enrollment
        let enrollmentId = "";
        const studentId = updated.student?._id?.toString() || (typeof updated.student === 'string' ? updated.student : null);
        
        if (studentId) {
              const enrollment = await this.enrollmentLinkRepo.findOne({
                  studentId: studentId as any,
                  courseId: id as any,
                  status: 'active'
              });
              enrollmentId = (enrollment as any)?._id?.toString() || id;

             logger.info(`Regenerating sessions for ${remainingWeeks} weeks for course ${id}`);
             
             await this.mentorRequestService.generateSessionsForWeeks(
                studentId,
                newMentorId,
                updated.subject.toString(), // assuming mapped or ID
                id,
                enrollmentId,
                newSlots,
                remainingWeeks,
                (updated.courseType as 'one-to-one' | 'group')
             );
        }
    }

    // 6. Notifications (Simplified)
    this._sendUpdateNotifications(updated as unknown as { student?: { _id: { toString(): string } } | string, mentor?: { _id: { toString(): string } } | string, subject?: { subjectName?: string } | string, schedule?: { days: string[], timeSlot: string } }, id, scheduleChanged || mentorChanged);

    // 7. Sync Slots 
    if (newMentorId) {
        this.schedulingService.generateMentorSlots(newMentorId, 30).catch(err => 
            logger.error(`Failed to generate mentor slots on course update:`, err)
        );
    }

    return updated;
  }

  private async _sendUpdateNotifications(updated: { student?: { _id: { toString(): string } } | string, mentor?: { _id: { toString(): string } } | string, subject?: { subjectName?: string } | string, schedule?: { days: string[], timeSlot: string } }, courseId: string, scheduleChanged: boolean) {
      if (!scheduleChanged) return;
      try {
          const studentId = typeof updated.student === 'object' ? updated.student?._id?.toString() : updated.student;
          const mentorId = typeof updated.mentor === 'object' ? updated.mentor?._id?.toString() : updated.mentor;
          const subjectName = typeof updated.subject === 'object' ? updated.subject?.subjectName : 'Course';
          const schedule = updated.schedule || { days: [], timeSlot: "" };
          const scheduleInfo = `${schedule.days.join(', ')} at ${schedule.timeSlot}`;

          if (studentId) {
              await this.notificationService.createNotification(
                  studentId, 'student', 'mentor_assigned', 'Course Updated', 
                  `Schedule updated for ${subjectName}: ${scheduleInfo}`, 
                  { courseId, subjectName }
              );
          }
           if (mentorId) {
              await this.notificationService.createNotification(
                  mentorId, 'mentor', 'mentor_assigned', 'Course Updated', 
                  `Schedule updated for ${subjectName}: ${scheduleInfo}`, 
                  { courseId, subjectName }
              );
          }
      } catch(error) {
        // Log error sending update notifications
        logger.error(`Error finding TrialClass ${courseId}:`, error);
      }
  }

  async getAllOneToOneCourses() {
    return await this.courseRepo.getAllOneToOneCourses();
  }

  async getAllCoursesPaginated(params: CoursePaginationParams): Promise<PaginatedResponse<unknown>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const result = await this.courseRepo.findAllCoursesPaginated(params);
      const totalPages = Math.ceil(result.total / limit);

      return {
        success: true,
        data: result.courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error fetching paginated courses:", error);
      throw new AppError(MESSAGES.ADMIN.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllGrades(): Promise<GradeResponseDto[]> {
    return await this.gradeService.getAllGrades();
  }

  async getSubjectsByGrade(gradeId: string): Promise<SubjectResponseDto[]> {
    return await this.subjectService.getSubjectsByGrade(gradeId);
  }

  async enrollStudentToCourse(courseId: string, studentId: string): Promise<unknown> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new AppError(MESSAGES.ADMIN.COURSE_NOT_FOUND, HttpStatusCode.NOT_FOUND);

    if (course.courseType === 'one-to-one') {
      return await this.updateOneToOneCourse(courseId, { studentId });
    } else {
      const existing = await this.enrollmentLinkRepo.findOne({ 
        student: studentId as any, 
        course: courseId as any 
      });
      if (existing) {
         // Check if status is active or similar if needed
         return course; // Or throw if business logic dictates
      }

      await this.enrollmentLinkRepo.create({
        student: studentId as any,
        course: courseId as any,
        status: 'active' as any
      } as any); 
      logger.info(`Enrollment record SUCCESS for student ${studentId}`);

      // Send Notification to Student
      try {
        const subjectName = (course.subject as unknown as { subjectName?: string })?.subjectName || 'Course';
        const schedule = course.schedule || { days: [], timeSlot: "" };
        const scheduleInfo = schedule.days && schedule.timeSlot 
            ? `on ${schedule.days.join(', ')} at ${schedule.timeSlot}`
            : '';

        await this.notificationService.createNotification(
            studentId,
            'student',
            'mentor_assigned',
            'Enrolled in New Course',
            `You have been enrolled in the group course: ${subjectName} ${scheduleInfo}.`,
            { courseId: course._id, subjectName, schedule }
        );
      } catch (error) {
        logger.error(`Failed to send enrollment notification to student ${studentId}:`, error);
      }

      // CREATE PAYMENT RECORD FOR FINANCIAL VISIBILITY
      await this._createAdminPaymentRecord(studentId, 0, `Enrollment: ${(course.subject as any)?.subjectName || 'Course'}`);

      // Trigger Slot Synchronization
      if (course.mentor) {
        this.schedulingService.generateMentorSlots(course.mentor.toString(), 30).catch(err => 
          logger.error(`Failed to generate mentor slots on enrollment:`, err)
        );
      }

      return await this.courseRepo.updateCourse(courseId, { $inc: { enrolledStudents: 1 } } as any);
    }
  }

  async unenrollStudentFromCourse(courseId: string, studentId: string): Promise<unknown> {
    const course = await this.courseRepo.findById(courseId);
    if (!course) throw new AppError(MESSAGES.ADMIN.COURSE_NOT_FOUND, HttpStatusCode.NOT_FOUND);

    if (course.courseType === 'one-to-one') {
      return await this.updateOneToOneCourse(courseId, { studentId: undefined });
    } else {
      await this.enrollmentLinkRepo.deleteByFilter({ 
        student: studentId as any, 
        course: courseId as any 
      });
      
      // Send Notification to Student
      try {
        const subjectName = (course.subject as unknown as { subjectName?: string })?.subjectName || 'Course';
        await this.notificationService.createNotification(
            studentId,
            'student',
            'session_cancelled',
            'Unenrolled from Course',
            `You have been unenrolled from the course: ${subjectName}.`,
            { courseId: course._id, subjectName }
        );
      } catch (error) {
        logger.error(`Failed to send unenrollment notification to student ${studentId}:`, error);
      }

      // Trigger Slot Synchronization
      if (course.mentor) {
        this.schedulingService.generateMentorSlots(course.mentor.toString(), 30).catch(err => 
          logger.error(`Failed to generate mentor slots on unenrollment:`, err)
        );
      }

      return await this.courseRepo.updateCourse(courseId, { $inc: { enrolledStudents: -1 } } as unknown as Partial<import("../interfaces/repositories/ICourseRepository").CreateOneToOneCourseDto>);
    }
  }
  /**
   * Parses a schedule timeSlot string (e.g. "19:00-20:00" or "19:00-20:00|19:00-20:00")
   * and a days array into the slot format required by generateSessionsForWeeks.
   */
  private _parseScheduleToSlots(
    days: string[],
    timeSlot: string
  ): { day: string; startTime: string; endTime: string }[] {
    // Handle multi-day different times format ("19:00-20:00|10:00-11:00")
    const timeParts = timeSlot.split('|').map(t => t.trim());

    const parseTime = (raw: string) => {
      if (!raw) return '00:00';
      const [cleanTime, mod] = raw.trim().split(' ');
      const parts = (cleanTime || '00:00').split(':').map(Number);
      let h = parts[0] || 0;
      const m = parts[1] || 0;
      if (mod) {
        if (mod.toLowerCase() === 'pm' && h < 12) h += 12;
        if (mod.toLowerCase() === 'am' && h === 12) h = 0;
      }
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    return days.map((day, index) => {
      // Use per-day time if available, otherwise fall back to first part
      const part = timeParts[index] || timeParts[0] || '10:00-11:00';
      const splitParts = part.split('-').map(s => s.trim());
      const rawStart: string = splitParts[0] ?? '00:00';
      const rawEnd: string = splitParts[1] ?? '00:00';
      return {
        day: day.charAt(0).toUpperCase() + day.slice(1).toLowerCase(),
        startTime: parseTime(rawStart),
        endTime: parseTime(rawEnd)
      };
    });
  }

  private async _triggerSessionSync(mentorId: string) {
    try {
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);
        
        // Use timeSlotRepo to find slots
        const slots = await this.timeSlotRepo.find({
            mentorId: mentorId as any,
            startTime: { $gte: today, $lte: nextMonth } as any
        });

        const slotsFormatted = slots.map(slot => {
            const typed = slot as unknown as { _id: { toString(): string }, mentorId: { toString(): string }, startTime: Date, endTime: Date };
            return {
                _id: typed._id.toString(),
                mentorId: typed.mentorId.toString(),
                startTime: typed.startTime,
                endTime: typed.endTime
            };
        });

        await this.sessionService.syncSessionsFromSlots(slotsFormatted);
        logger.info(`Triggered session sync for mentor ${mentorId}`);
    } catch (error) {
        logger.error(`Error triggering session sync:`, error);
    }
  }

  private async _createAdminPaymentRecord(studentId: string, amount: number, purpose: string) {
    if (amount <= 0) return;
    try {
        const invoiceId = `ADMIN-INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await this.paymentRepo.create({
            studentId: new Types.ObjectId(studentId) as any,
            amount: amount,
            currency: 'inr',
            status: 'completed',
            method: 'other',
            type: 'SUBSCRIPTION',
            purpose: purpose,
            invoiceId: invoiceId,
        });
        logger.info(`Created admin payment record ${invoiceId} for student ${studentId}`);
    } catch (error) {
        logger.error(`Failed to create admin payment record for student ${studentId}:`, error);
    }
  }
}