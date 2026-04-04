import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { ISessionService } from "../interfaces/services/ISessionService.js";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository.js";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository.js";
import type { ISession, ISessionParticipant } from "../interfaces/models/session.interface.js";
import type { INotificationService } from "../interfaces/services/INotificationService.js";
import type { ISchedulingService } from "../interfaces/services/ISchedulingService.js";
import type { IAttendanceService } from "../interfaces/services/IAttendanceService.js";

import type { IBookingRepository } from "../interfaces/repositories/IBookingRepository.js";
import type { ISubjectRepository } from "../interfaces/repositories/ISubjectRepository.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { ILeaveEligibilityService, LeaveEligibilityResponse } from "../interfaces/services/ILeaveEligibilityService.js";
import { logger } from "../utils/logger.js";
import { Types } from "mongoose";
import { MESSAGES } from "../constants/messages.constants.js";
import { AppError } from "../utils/AppError.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { STUDENT_CANCEL_CUTOFF_HOURS } from "../config/leavePolicy.config.js";
import { BOOKING_STATUS, SESSION_STATUS } from "../constants/status.constants.js";
import { combineISTToUTC } from "../utils/time.util.js";

@injectable()
export class SessionService implements ISessionService {
  constructor(
    @inject(TYPES.ISessionRepository) private sessionRepo: ISessionRepository,
    @inject(TYPES.ITimeSlotRepository) private timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.IBookingRepository) private bookingRepo: IBookingRepository,
    @inject(TYPES.ISubjectRepository) private subjectRepo: ISubjectRepository,
    @inject(TYPES.IStudentRepository) private studentRepo: IStudentRepository,
    @inject(TYPES.ILeaveEligibilityService) private leaveEligibilityService: ILeaveEligibilityService,
    @inject(TYPES.INotificationService) private notificationService: INotificationService,
    @inject(TYPES.ISchedulingService) private schedulingService: ISchedulingService,
    @inject(TYPES.IAttendanceService) private attendanceService: IAttendanceService,
    @inject(TYPES.ITrialClassRepository) private trialClassRepo: any // Using any to avoid complex type import if not easy
  ) {}

  private readonly MENTOR_CANCEL_CUTOFF_HOURS = 48;

  private getRawId(val: any): string {
    if (!val) return '';
    return val._id ? val._id.toString() : val.toString();
  }

  async getStudentUpcomingSessions(studentId: string): Promise<ISession[]> {
    const sessions = await this.sessionRepo.findUpcomingByStudent(studentId);
    return sessions;
  }

  async getStudentUpcomingSessionsPaginated(studentId: string, page: number, limit: number, filter?: { startDate?: Date | undefined; endDate?: Date | undefined }): Promise<{ items: ISession[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.sessionRepo.findUpcomingByStudent(studentId, { skip, limit }, filter),
      this.sessionRepo.countUpcomingByStudent(studentId, filter)
    ]);
    
    // Explicitly format id 
    const enrichedItems = items.map((session: any) => {
        const sessionObj = session.toObject ? session.toObject() : session;
        return {
            ...sessionObj,
            id: this.getRawId(sessionObj)
        };
    });

    return { items: enrichedItems as any[], total };
  }

  async getStudentUpcomingSessionsWithEligibility(studentId: string): Promise<LeaveEligibilityResponse> {
    const now = new Date();
    const sessions = await this.sessionRepo.findUpcomingByStudent(studentId);
    return this.leaveEligibilityService.computeStudentEligibility(sessions, now);
  }


  async getMentorUpcomingSessions(mentorId: string): Promise<ISession[]> {
    return this.sessionRepo.findUpcomingByMentor(mentorId);
  }

  async getMentorUpcomingSessionsPaginated(mentorId: string, page: number, limit: number, filter?: { startDate?: Date | undefined; endDate?: Date | undefined }): Promise<{ items: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.sessionRepo.findUpcomingByMentor(mentorId, { skip, limit }, filter),
      this.sessionRepo.countUpcomingByMentor(mentorId, filter)
    ]);

    // Filter: Include all scheduled/in_progress. Include cancelled ONLY if they start today.
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const enrichedItems = items
      .filter((session: any) => {
        if (session.status !== SESSION_STATUS.CANCELLED) return true;
        const sessionStart = new Date(session.startTime);
        return sessionStart >= todayStart && sessionStart <= todayEnd;
      })
      .map((session: any) => {
        const sessionObj = session.toObject ? session.toObject() : session;
        const diffInHours = (new Date(sessionObj.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

        return {
          ...sessionObj,
          id: this.getRawId(sessionObj),
          canApplyLeave: sessionObj.status === SESSION_STATUS.SCHEDULED && diffInHours >= this.MENTOR_CANCEL_CUTOFF_HOURS
        };
      });

    return { items: enrichedItems, total };
  }

  async getMentorTodaySessions(mentorId: string): Promise<any[]> {
    const today = new Date();
    today.setHours(0,0,0,0);
    const sessions = await this.sessionRepo.findTodayByMentor(mentorId, today);

    return sessions.map((session: any) => {
      const sessionObj = session.toObject ? session.toObject() : session;
      const diffInHours = (new Date(sessionObj.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

      return {
        ...sessionObj,
        id: this.getRawId(sessionObj),
        canApplyLeave: sessionObj.status === SESSION_STATUS.SCHEDULED && diffInHours >= this.MENTOR_CANCEL_CUTOFF_HOURS
      };
    });
  }

  async createSession(data: Partial<ISession>): Promise<ISession> {
    return this.sessionRepo.create(data);
  }

  async getSessionById(sessionId: string): Promise<any | null> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) return null;

    // Alias fields to match frontend expectations
    return {
      ...session,
      student: session.studentId,
      mentor: session.mentorId,
      subject: session.subjectId
    };
  }
 
  async updateSessionStatus(sessionId: string, status: string): Promise<ISession | null> {
    // Basic status update
    return this.sessionRepo.updateStatus(sessionId, status);
  }

  // NEW: Idempotent sync for a specific range (e.g., next 14 days)
  async syncSessionsForRange(from: Date, to: Date): Promise<void> {
    try {
      logger.info(`[SessionService] Syncing sessions for range: ${from.toISOString()} to ${to.toISOString()}`);
      
      // 1. Find all booked slots in the window
      const slots = await this.timeSlotRepo.find({
        startTime: { $gte: from, $lte: to },
        status: 'booked'
      });

      if (slots.length === 0) {
        logger.info('[SessionService] No booked slots found in range for sync');
        return;
      }

      // 2. Map and sync
      await this.syncSessionsFromSlots(slots.map(slot => ({
        _id: (slot as unknown as { _id: { toString(): string } })._id.toString(),
        mentorId: slot.mentorId.toString(),
        startTime: slot.startTime,
        endTime: slot.endTime
      })));

      logger.info(`[SessionService] Successfully synced ${slots.length} session windows`);
    } catch (error) {
      logger.error(`Error in syncSessionsForRange: ${error}`);
      throw error;
    }
  }

  // Helper to sync sessions from slots (Idempotent via unique index)
  async syncSessionsFromSlots(slots: Array<{ _id: string; mentorId: string; startTime: Date; endTime: Date }>): Promise<void> {
    try {
      logger.info(`[SessionService] Processing ${slots.length} slots into Sessions...`);
      
      for (const slot of slots) {
        // Define "Active Booking" as status SCHEDULED, populate studentSubjectId to get subjectId
        const booking = await this.bookingRepo.findOneWithPopulate(
          { timeSlotId: slot._id, status: BOOKING_STATUS.SCHEDULED },
          'studentSubjectId'
        );
        if (!booking) continue;

        const allBookings = await this.bookingRepo.find({
          timeSlotId: slot._id, status: BOOKING_STATUS.SCHEDULED
        });

        const existingSession = await this.sessionRepo.existsByTimeSlot(slot._id);
        if (!existingSession) {
          logger.info(`[SessionSync] Creating session for slot ${slot._id} at ${slot.startTime.toISOString()}`);
          
          // Safely extract subjectId from populated studentSubjectId
          const studentSubject = booking.studentSubjectId as any;
          const subjectId = booking.subjectId || studentSubject?.subjectId;

          // Cast the array explicitly to ISessionParticipant to restrict 'role' and 'status' types
          const participants: ISessionParticipant[] = allBookings.map((b: any) => ({
            userId: new Types.ObjectId(b.studentId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
            role: 'student' as const,
            status: 'scheduled' as const
          }));
          
          participants.push({
            userId: new Types.ObjectId(slot.mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
            role: 'mentor' as const,
            status: 'scheduled' as const
          });

          await this.sessionRepo.create({
            mentorId: new Types.ObjectId(slot.mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
            timeSlotId: new Types.ObjectId(slot._id.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
            subjectId: subjectId, 
            courseId: booking.courseId || (booking as any).courseId,
            enrollmentId: booking.enrollmentId || (booking as any).enrollmentId,
            studentId: new Types.ObjectId(booking.studentId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            status: SESSION_STATUS.SCHEDULED,
            sessionType: booking.isGroup ? 'group' : 'one-to-one',
            participants: participants
          });

        }
      }
    } catch (error) {
      logger.error(`Error syncing sessions from slots: ${error}`);
    }
  }

  async findByStudentAndSubject(studentId: string, subjectId: string): Promise<ISession[]> {
    return this.sessionRepo.findByStudentAndSubject(studentId, subjectId);
  }

  async updateStatus(id: string, status: string): Promise<ISession | null> {
    return this.sessionRepo.updateStatus(id, status);
  }

  async reportAbsence(sessionId: string, studentId: string, reason: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new AppError(MESSAGES.SESSION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    
    logger.info(`[DEBUG reportAbsence] START for sessionId="${sessionId}", studentId="${studentId}"`);
    logger.info(`[DEBUG] Raw session.timeSlotId =`, session.timeSlotId);
    logger.info(`[DEBUG] Raw session.subjectId =`, session.subjectId);
    logger.info(`[DEBUG] Raw session.mentorId =`, session.mentorId);
    logger.info(`[DEBUG] getRawId(timeSlotId) =`, this.getRawId(session.timeSlotId));
    logger.info(`[DEBUG] getRawId(subjectId) =`, this.getRawId(session.subjectId));
    logger.info(`[DEBUG] getRawId(mentorId) =`, this.getRawId(session.mentorId));

    // Authorization check
    const isParticipant = session.participants.some(p => this.getRawId(p.userId) === studentId) || 
                          (this.getRawId(session.studentId) === studentId);
    if (!isParticipant) throw new AppError(MESSAGES.SESSION.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);

    // Cutoff Validation: 24-hour rule for students
    const STUDENT_LEAVE_CUTOFF_HOURS = 24;
    const now = new Date();
    const diffInHours = (new Date(session.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < STUDENT_LEAVE_CUTOFF_HOURS) {
      logger.warn(`Student ${studentId} absence report rejected: Session ${sessionId} starts in ${diffInHours.toFixed(2)}h (Cutoff: ${STUDENT_LEAVE_CUTOFF_HOURS}h)`);
      throw new AppError(MESSAGES.SESSION.CANCEL_CUTOFF_ERROR, HttpStatusCode.BAD_REQUEST);
    }

    // Fetch student details for notification
    const student = await this.studentRepo.findById(studentId);
    const subjectIdRaw = this.getRawId(session.subjectId);
    const subject = subjectIdRaw ? await this.subjectRepo.findById(subjectIdRaw) : null;
    
    // Format session time
    const sessionDate = new Date(session.startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const sessionTime = new Date(session.startTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (session.sessionType === 'group') {
      const updatedParticipants = session.participants.map(p => 
        p.userId.toString() === studentId ? { ...p, status: 'absent' as const } : p
      );
      
      await this.sessionRepo.updateById(sessionId, { participants: updatedParticipants });
      
      await this.bookingRepo.updateMany(
        { 
          timeSlotId: new Types.ObjectId(this.getRawId(session.timeSlotId)) as any, 
          studentId: new Types.ObjectId(studentId) as any
        },
        { status: BOOKING_STATUS.ABSENT }
      );

      await this.studentRepo.incrementCancellationCount(studentId);

      await this.notificationService.notifyUser(
        this.getRawId(session.mentorId), 
        'mentor', 
        'session_cancelled', 
        { 
          sessionId, 
          studentId,
          studentName: student?.fullName || 'Student',
          subjectName: subject?.subjectName || 'Session',
          sessionDate,
          sessionTime,
          reason,
          message: `Student ${student?.fullName || ''} will be absent for the group session scheduled for ${sessionDate} at ${sessionTime}. Reason: ${reason}.`
        },
        ['web', 'email']
      );
    } else {
      await this.sessionRepo.updateById(sessionId, { 
        status: SESSION_STATUS.CANCELLED,
        cancellationReason: reason,
        cancelledBy: 'student'
      });
      
      await this.bookingRepo.updateMany(
        { 
            timeSlotId: new Types.ObjectId(this.getRawId(session.timeSlotId)) as any, 
            studentId: new Types.ObjectId(studentId) as any 
        },
        { status: BOOKING_STATUS.CANCELLED }
      );

      await this.studentRepo.incrementCancellationCount(studentId);

      await this.notificationService.notifyUser(
        this.getRawId(session.mentorId), 
        'mentor', 
        'session_cancelled', 
        { 
          sessionId, 
          studentId,
          studentName: student?.fullName || 'Student',
          subjectName: subject?.subjectName || 'Session',
          sessionDate,
          sessionTime,
          reason,
          message: `Student ${student?.fullName || ''} has cancelled the 1:1 session scheduled for ${sessionDate} at ${sessionTime}. Reason: ${reason}. The slot is now available.`
        },
        ['web', 'email']
      );

      await this.timeSlotRepo.releaseCapacity(this.getRawId(session.timeSlotId));
    }
  }

  async cancelSession(sessionId: string, mentorId: string, reason: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new AppError(MESSAGES.SESSION.NOT_FOUND, HttpStatusCode.NOT_FOUND);

    logger.info(`[DEBUG cancelSession] START for sessionId="${sessionId}", mentorId="${mentorId}"`);
    logger.info(`[DEBUG] Raw session.timeSlotId =`, session.timeSlotId);
    logger.info(`[DEBUG] Raw session.mentorId =`, session.mentorId);
    logger.info(`[DEBUG] getRawId(timeSlotId) =`, this.getRawId(session.timeSlotId));
    logger.info(`[DEBUG] getRawId(mentorId) =`, this.getRawId(session.mentorId));

    const mentorIdRaw = this.getRawId(session.mentorId);
    const timeSlotIdRaw = this.getRawId(session.timeSlotId);

    if (mentorIdRaw !== mentorId) {
      logger.error(`[DEBUG] Authorization failed: mentorIdRaw(${mentorIdRaw}) !== mentorId(${mentorId})`);
      throw new AppError(MESSAGES.SESSION.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
    }

  // 48-hour cutoff validation
  const now = new Date();
  const diffInHours = (new Date(session.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);

  if (diffInHours < this.MENTOR_CANCEL_CUTOFF_HOURS) {
    logger.warn(`Mentor ${mentorId} cancellation rejected: Session ${sessionId} starts in ${diffInHours.toFixed(2)}h`);
    throw new AppError(MESSAGES.SESSION.CANCEL_CUTOFF_ERROR, HttpStatusCode.BAD_REQUEST);
  }

  // Update session status
  await this.sessionRepo.updateById(sessionId, {
    status: SESSION_STATUS.CANCELLED,
    cancelledBy: 'mentor',
    cancellationReason: reason
  });

  // Safely update bookings
  const bookingFilter: any = { sessionId: new Types.ObjectId(sessionId) };

  if (timeSlotIdRaw) {
    bookingFilter.$or = [
      { sessionId: new Types.ObjectId(sessionId) },
      { timeSlotId: new Types.ObjectId(timeSlotIdRaw) }
    ];
  }

  await this.bookingRepo.updateMany(
    bookingFilter,
    {
      status: BOOKING_STATUS.CANCELLED,
      rebookingRequired: true,
      rebookMentorId: new Types.ObjectId(mentorIdRaw)
    }
  );

  // Notify students
  for (const participant of session.participants || []) {
    if (participant.role === 'student') {
      await this.notificationService.notifyUser(
        this.getRawId(participant.userId),
        'student',
        'mentor_absence_reschedule',
        { 
          sessionId, 
          reason, 
          message: `Your mentor has cancelled the session. Please choose another time slot with the same mentor.` 
        },
        ['web', 'email']
      );
    }
  }

  // Release time slot capacity
  if (timeSlotIdRaw) {
    await this.timeSlotRepo.releaseCapacity(timeSlotIdRaw);
  }

  logger.info(`✅ Session ${sessionId} successfully cancelled by mentor ${mentorId}`);
}
  async resolveRescheduling(sessionId: string, studentId: string, newTimeSlotId?: string, slotDetails?: { date: string, startTime: string, endTime: string }): Promise<void> {
    try {
      logger.info(`[SessionService.resolveRescheduling] START for sessionId=${sessionId}, studentId=${studentId}, newTimeSlotId=${newTimeSlotId || 'N/A'}`);
      
      const session = await this.sessionRepo.findById(sessionId);
      if (!session) {
          logger.warn(`[SessionService.resolveRescheduling] Session ${sessionId} not found`);
          throw new AppError(MESSAGES.SESSION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      const mentorIdRaw = this.getRawId(session.mentorId);
      const subjectIdRaw = this.getRawId(session.subjectId);
      const studentIdRaw = this.getRawId(session.studentId);
      
      logger.debug(`[SessionService.resolveRescheduling] Session details: mentorId=${mentorIdRaw}, subjectId=${subjectIdRaw}, studentId=${studentIdRaw}`);

      // Authorization: for students, allow if they are primary studentId OR in participants
      const isAuthorized = studentIdRaw === studentId ||
                           session.participants.some(p => this.getRawId(p.userId) === studentId);

      if (!isAuthorized) {
          logger.warn(`[SessionService.resolveRescheduling] Student ${studentId} NOT authorized for session ${sessionId}`);
          throw new AppError(MESSAGES.SESSION.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
      }

      if (newTimeSlotId || slotDetails) {
        // RESCHEDULE CASE
        logger.info(`[SessionService.resolveRescheduling] Handling RESCHEDULE for session ${sessionId}`);

        let effectiveSlotId = newTimeSlotId;

        // If no direct ID but we have details (template slot), ensure concrete slot exists
        if (!effectiveSlotId && slotDetails) {
          const targetDate = new Date(slotDetails.date);
          
          logger.debug(`[SessionService.resolveRescheduling] Converting slotDetails.date="${slotDetails.date}" -> targetDate="${targetDate.toISOString()}"`);
          
          const startParams = combineISTToUTC(targetDate, slotDetails.startTime);
          const endParams = combineISTToUTC(targetDate, slotDetails.endTime);

          logger.info(`[SessionService.resolveRescheduling] Converting IST to UTC: ${slotDetails.startTime} IST -> ${startParams.toISOString()}`);

          effectiveSlotId = await this.schedulingService.ensureTimeSlot(
            mentorIdRaw,
            startParams,
            endParams
          );
          logger.info(`[SessionService.resolveRescheduling] Ensured/Created slot ${effectiveSlotId} for rescheduling`);
        }
        
        if (!effectiveSlotId) {
            logger.error(`[SessionService.resolveRescheduling] Failed to resolve effectiveSlotId for session ${sessionId}`);
            throw new AppError(MESSAGES.SESSION.INVALID_STATE, HttpStatusCode.BAD_REQUEST);
        }

        const newSlot = await this.timeSlotRepo.findById(effectiveSlotId);
        if (!newSlot) {
            logger.error(`[SessionService.resolveRescheduling] New slot ${effectiveSlotId} NOT found in repository`);
            throw new AppError(MESSAGES.AVAILABILITY.SLOT_NOT_FOUND, HttpStatusCode.NOT_FOUND);
        }
        
        logger.debug(`[SessionService.resolveRescheduling] Checking conflicts for newSlot starting at ${newSlot.startTime}`);

        // COMPEHENSIVE Conflict Validation
        // 1. Regular Sessions (Scheduled, In Progress, Rescheduling)
        const existingConflict = await this.sessionRepo.find({
          mentorId: session.mentorId,
          startTime: newSlot.startTime,
          status: { $in: [SESSION_STATUS.SCHEDULED, SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.RESCHEDULING] }
        });

        if (existingConflict.length > 0) {
          logger.warn(`[SessionService.resolveRescheduling] Conflict: Mentor ${mentorIdRaw} already has ${existingConflict.length} regular sessions at ${newSlot.startTime}`);
          throw new AppError("Mentor has a conflicting session at this time.", HttpStatusCode.BAD_REQUEST);
        }

        // 2. Trial Classes (Assigned, Scheduled)
        logger.debug(`[SessionService.resolveRescheduling] Searching trial conflicts for mentor ${mentorIdRaw} on date range`);
        const searchStart = new Date(new Date(newSlot.startTime).setHours(0,0,0,0));
        const searchEnd = new Date(new Date(newSlot.startTime).setHours(23,59,59,999));
        
        const trialConflict = await this.trialClassRepo.find({
          mentor: mentorIdRaw,
          preferredDate: {
            $gte: searchStart,
            $lte: searchEnd
          },
          status: { $in: ['assigned', 'scheduled'] }
        });

        logger.debug(`[SessionService.resolveRescheduling] Found ${trialConflict.length} potential trial conflicts`);

        const hasOverlappingTrial = trialConflict.some((trial: any) => {
          if (!trial.preferredTime || typeof trial.preferredTime !== 'string') {
              logger.warn(`[SessionService.resolveRescheduling] Trial class ${trial._id} missing preferredTime. Skipping check.`);
              return false;
          }
          // Trial classes use HH:MM preferredTime string
          const [hStr, mStr] = trial.preferredTime.split(':');
          const h = parseInt(hStr || '0');
          const m = parseInt(mStr || '0');
          const trialStart = new Date(trial.preferredDate);
          trialStart.setHours(h, m, 0, 0);
          
          const isMatch = trialStart.getTime() === new Date(newSlot.startTime).getTime();
          if (isMatch) logger.info(`[SessionService.resolveRescheduling] Trial conflict confirmed with TrialClass ${trial._id}`);
          return isMatch;
        });

        if (hasOverlappingTrial) {
          throw new AppError("Mentor has a conflicting trial class at this time.", HttpStatusCode.BAD_REQUEST);
        }

        if (newSlot.status !== 'available' && newSlot.status !== 'reserved') {
          logger.warn(`[SessionService.resolveRescheduling] Slot ${effectiveSlotId} is in status "${newSlot.status}" (NOT available/reserved)`);
          throw new AppError(MESSAGES.AVAILABILITY.SLOT_NOT_AVAILABLE, HttpStatusCode.BAD_REQUEST);
        }

        // 1. Reserve and Confirm new slot
        logger.info(`[SessionService.resolveRescheduling] Reserving capacity for slot ${effectiveSlotId}`);
        const updatedSlot = await this.timeSlotRepo.reserveCapacity(effectiveSlotId);
        if (!updatedSlot) {
            logger.error(`[SessionService.resolveRescheduling] Failed to reserve capacity for slot ${effectiveSlotId}`);
            throw new AppError("Failed to reserve slot capacity.", HttpStatusCode.INTERNAL_SERVER_ERROR);
        }

        // 2. Create NEW session document for the rescheduled time
        logger.debug(`[SessionService.resolveRescheduling] Creating new session document...`);
        
        const safeObjectId = (id: string | undefined) => {
            if (id && Types.ObjectId.isValid(id)) return new Types.ObjectId(id) as unknown as import('mongoose').Schema.Types.ObjectId;
            return undefined;
        };

        const newSessionData: Partial<ISession> = {
          timeSlotId: safeObjectId(effectiveSlotId)!,
          mentorId: safeObjectId(mentorIdRaw)!,
          subjectId: safeObjectId(subjectIdRaw) as any,
          sessionType: session.sessionType,
          participants: (session.participants || []).map((p: any) => {
              const rawUid = this.getRawId(p.userId);
              return { 
                ...p, 
                userId: safeObjectId(rawUid)
              };
          }),
          startTime: newSlot.startTime,
          endTime: newSlot.endTime,
          status: SESSION_STATUS.SCHEDULED,
          isRescheduled: true,
          ...(studentIdRaw && Types.ObjectId.isValid(studentIdRaw) && { studentId: new Types.ObjectId(studentIdRaw) as any }),
          ...(session.courseId && Types.ObjectId.isValid(this.getRawId(session.courseId)) && { courseId: new Types.ObjectId(this.getRawId(session.courseId)) as any }),
          ...(session.enrollmentId && Types.ObjectId.isValid(this.getRawId(session.enrollmentId)) && { enrollmentId: new Types.ObjectId(this.getRawId(session.enrollmentId)) as any }),
        };
        const newSession = await this.sessionRepo.create(newSessionData);
        const newSessionId = (newSession as any)._id.toString();
        logger.info(`[SessionService.resolveRescheduling] NEW session created: ${newSessionId}`);

        // 3. Mark OLD session as cancelled and link to the new one
        const updateData: any = {
          status: SESSION_STATUS.CANCELLED,
          cancelledBy: 'mentor',          // was cancelled by mentor originally
          isRescheduled: true,
        };
        const rTo = safeObjectId(newSessionId);
        if (rTo) updateData.rescheduledTo = rTo;
        
        await this.sessionRepo.updateById(sessionId, updateData);

        // 4. Update Booking to point at the new session's slot
        logger.debug(`[SessionService.resolveRescheduling] Updating associated bookings to student ${studentId}`);
        const studentObjId = safeObjectId(studentId);
        const newSlotObjId = safeObjectId(effectiveSlotId);
        const newSessObjId = safeObjectId(newSessionId);

        if (studentObjId) {
            const bookingUpdate: any = { status: BOOKING_STATUS.SCHEDULED };
            if (newSlotObjId) bookingUpdate.timeSlotId = newSlotObjId;
            if (newSessObjId) bookingUpdate.sessionId = newSessObjId;

            await this.bookingRepo.updateMany(
              { $or: [{ sessionId: session._id }, { timeSlotId: session.timeSlotId }], studentId: studentObjId as any },
              bookingUpdate
            );
        }

        // 4. Notify Mentor
        const subjectIdStr = (session.subjectId as any)?.toString() || "";
        const subject = subjectIdRaw ? await this.subjectRepo.findById(subjectIdStr) : null;

        await this.notificationService.notifyUser(
          mentorIdRaw,
          'mentor',
          'session_rescheduled',
          {
            sessionId,
            subjectName: subject?.subjectName || 'Session',
            startTime: newSlot.startTime.toISOString(),
            message: `A student has rescheduled a session to a new time slot.`
          },
          ['web']
        );
        logger.info(`[SessionService.resolveRescheduling] END (SUCCESS) for sessionId=${sessionId}`);

      } else {
        // REFUND CASE
        logger.info(`[SessionService.resolveRescheduling] Handling REFUND for session ${sessionId}`);

        // 1. Update Session Status
        await this.sessionRepo.updateStatus(sessionId, SESSION_STATUS.CANCELLED);

        // 2. Find Booking to process refund
        const booking = await this.bookingRepo.findOne({ 
          $or: [{ sessionId: session._id }, { timeSlotId: session.timeSlotId }], 
          studentId: new Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId 
        });

        if (booking) {
          const bookingObj = booking as unknown as { amount?: number; cost?: number };
          const refundAmount = bookingObj.amount || bookingObj.cost || 0;
          if (refundAmount > 0) {
            logger.info(`[SessionService.resolveRescheduling] Refund of ${refundAmount} for session ${sessionId} should be processed manually`);
          }

          // 3. Update Booking Status
          await this.bookingRepo.updateById((booking as any)._id.toString(), { status: BOOKING_STATUS.CANCELLED });
        }

        // 4. Notify Mentor
        await this.notificationService.notifyUser(
          mentorIdRaw,
          'mentor',
          'session_cancelled_refund',
          {
            sessionId,
            message: `Student has chosen a refund instead of rescheduling.`
          },
          ['web']
        );
        logger.info(`[SessionService.resolveRescheduling] END (REFUND SUCCESS) for sessionId=${sessionId}`);
      }
    } catch (error: any) {
        logger.error(`[SessionService.resolveRescheduling] CRITICAL ERROR for sessionId ${sessionId}: ${error.message}`, {
            stack: error.stack,
            sessionId,
            studentId,
            newTimeSlotId
        });
        throw error;
    }
  }

  async completeSession(sessionId: string, mentorId: string): Promise<ISession | null> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new AppError(MESSAGES.SESSION.NOT_FOUND, HttpStatusCode.NOT_FOUND);

    // Authorization: Only the assigned mentor can complete the session
    if (this.getRawId(session.mentorId) !== mentorId) {
      throw new AppError(MESSAGES.SESSION.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
    }

    // Idempotency: If already completed, return safely
    if (session.status === 'completed') {
      logger.info(`[SessionService] Session ${sessionId} already completed`);
      return session;
    }

    logger.info(`[SessionService] Completing session ${sessionId} by mentor ${mentorId}`);

    // Update Session status
    const updatedSession = await this.sessionRepo.updateStatus(sessionId, 'completed');

    // Update associated Booking status
    await this.bookingRepo.updateMany(
      { timeSlotId: session.timeSlotId, status: 'scheduled' },
      { status: 'completed' }
    );

    // Create automated attendance for all participants
    try {
      if (updatedSession && updatedSession.participants) {
        const studentId = updatedSession.participants.find(participant => participant.role === 'student')?.userId.toString();
        if (studentId) {
          await this.attendanceService.createAutomationAttendance(sessionId, studentId, mentorId);
        }
      }
    } catch (error) {
      logger.error(`[SessionService] Error creating automated attendance for session ${sessionId}:`, error);
    }

    return updatedSession;
  }

  async activateJoinLinksForTimeWindow(from: Date, to: Date): Promise<void> {
    try {
      logger.info(`[SessionService] Activating join links for window ${from.toISOString()} to ${to.toISOString()}`);

      // Dynamic import to avoid circular dependencies
      const { SessionAccessService } = await import('./scheduling/SessionAccessService.js');
      const sessionAccessService = new SessionAccessService();

      // 1. Find booked slots in the time window
      const slots = await this.timeSlotRepo.find({
        startTime: { $gte: from, $lte: to },
        status: 'booked'
      });

      // 2. Sync sessions from slots (ensure Session records exist)
      await this.syncSessionsFromSlots(slots.map(slot => ({
        _id: (slot as unknown as { _id: { toString(): string } })._id.toString(),
        mentorId: slot.mentorId.toString(),
        startTime: slot.startTime,
        endTime: slot.endTime
      })));

      // 3. For each slot, find session and notify participants
      for (const slot of slots) {
        try {
          const sessionRecord = await this.sessionRepo.findByTimeSlot(
            (slot as unknown as { _id: { toString(): string } })._id.toString()
          );
          if (!sessionRecord) continue;

          const subject = await this.subjectRepo.findById(slot.subjectId?.toString() || "");
          const subjectName = subject?.subjectName || 'Course';
          const sessionId = (sessionRecord as unknown as { _id: { toString(): string } })._id.toString();

          // Find bookings for this slot to notify students
          const bookings = await this.bookingRepo.find({ 
            timeSlotId: slot._id, 
            status: 'scheduled' 
          });

          // Notify Mentor
          const mentorLink = sessionAccessService.generateJoinLink(
            sessionId, 
            slot.mentorId.toString(), 
            'mentor', 
            slot.startTime
          );
          await this.notificationService.notifyUser(
            slot.mentorId.toString(),
            'mentor',
            'session_starting',
            { subjectName, joinLink: mentorLink },
            ['web']
          );

          // Notify Students
          for (const booking of bookings) {
            const studentId = (booking.studentId as unknown as { _id: { toString(): string } })._id.toString();
            const studentLink = sessionAccessService.generateJoinLink(
              sessionId, 
              studentId, 
              'student', 
              slot.startTime
            );
            await this.notificationService.notifyUser(
              studentId,
              'student',
              'session_starting',
              { subjectName, joinLink: studentLink },
              ['web']
            );
          }

          logger.info(`[SessionService] Sent join link notifications for session ${sessionId}`);
        } catch (error) {
          logger.error(`[SessionService] Error processing slot ${slot._id}:`, error);
        }
      }

      logger.info(`[SessionService] Completed join link activation for ${slots.length} slots`);
    } catch (error) {
      logger.error(`[SessionService] Error in activateJoinLinksForTimeWindow:`, error);
      throw error;
    }
  }

  async getAvailableSlotsForReschedule(mentorId: string, subjectId: string, date: string): Promise<any[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

    const slots = await this.timeSlotRepo.findAvailableSlots({
      mentorId: new Types.ObjectId(mentorId) as unknown as import('mongoose').Schema.Types.ObjectId,
      subjectId: new Types.ObjectId(subjectId) as unknown as import('mongoose').Schema.Types.ObjectId,
      startTime: { $gte: startOfDay, $lte: endOfDay },
      status: 'available'
    });

    return slots.map(slot => ({
      timeSlotId: (slot as any)._id,
      startTime: slot.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      endTime: slot.endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      mentorCount: 1 
    }));
  }
}
