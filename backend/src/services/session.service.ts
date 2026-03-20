import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { ISessionService } from "../interfaces/services/ISessionService.js";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository.js";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository.js";
import type { ISession } from "../interfaces/models/session.interface.js";
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
    @inject(TYPES.IAttendanceService) private attendanceService: IAttendanceService
  ) {}

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
    return { items, total };
  }

  async getStudentUpcomingSessionsWithEligibility(studentId: string): Promise<LeaveEligibilityResponse> {
    const sessions = await this.sessionRepo.findUpcomingByStudent(studentId);
    return this.leaveEligibilityService.computeStudentEligibility(sessions, new Date());
  }

  async getMentorUpcomingSessions(mentorId: string): Promise<ISession[]> {
    return this.sessionRepo.findUpcomingByMentor(mentorId);
  }

  async getMentorUpcomingSessionsPaginated(mentorId: string, page: number, limit: number, filter?: { startDate?: Date | undefined; endDate?: Date | undefined }): Promise<{ items: ISession[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.sessionRepo.findUpcomingByMentor(mentorId, { skip, limit }, filter),
      this.sessionRepo.countUpcomingByMentor(mentorId, filter)
    ]);
    return { items, total };
  }

  async getMentorTodaySessions(mentorId: string): Promise<ISession[]> {
    const today = new Date();
    today.setHours(0,0,0,0);
    return this.sessionRepo.findTodayByMentor(mentorId, today);
  }

  async createSession(data: Partial<ISession>): Promise<ISession> {
    return this.sessionRepo.create(data);
  }

  async getSessionById(sessionId: string): Promise<ISession | null> {
    const session = await this.sessionRepo.findById(sessionId);
    return session;
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

        const existingSession = await this.sessionRepo.existsByTimeSlot(slot._id);
        if (!existingSession) {
          logger.info(`[SessionSync] Creating session for slot ${slot._id} at ${slot.startTime.toISOString()}`);
          
          // Safely extract subjectId from populated studentSubjectId
          const studentSubject = booking.studentSubjectId as any;
          const subjectId = booking.subjectId || studentSubject?.subjectId;

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
            participants: [
              { userId: new Types.ObjectId(booking.studentId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId, role: 'student', status: 'scheduled' },
              { userId: new Types.ObjectId(slot.mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId, role: 'mentor', status: 'scheduled' }
            ]
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
    if (!session) throw new Error(MESSAGES.SESSION.NOT_FOUND);
    // Authorization check
    const isParticipant = session.participants.some(participant => participant.userId.toString() === studentId);
    if (!isParticipant) throw new Error(MESSAGES.SESSION.ACCESS_DENIED);

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
    const subject = await this.subjectRepo.findById(session.subjectId?.toString() || "");
    
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
          $or: [{ sessionId: session._id }, { timeSlotId: session.timeSlotId }], 
          studentId: new Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId 
        },
        { status: BOOKING_STATUS.ABSENT }
      );

      await this.studentRepo.incrementCancellationCount(studentId);

      await this.notificationService.notifyUser(
        session.mentorId.toString(), 
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
          $or: [{ sessionId: session._id }, { timeSlotId: session.timeSlotId }], 
          studentId: new Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId 
        },
        { status: BOOKING_STATUS.CANCELLED }
      );

      await this.studentRepo.incrementCancellationCount(studentId);

      await this.notificationService.notifyUser(
        session.mentorId.toString(), 
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

      await this.timeSlotRepo.releaseCapacity(session.timeSlotId.toString());
    }
  }

  async cancelSession(sessionId: string, mentorId: string, reason: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error(MESSAGES.SESSION.NOT_FOUND);

    if (session.mentorId.toString() !== mentorId) throw new Error(MESSAGES.SESSION.ACCESS_DENIED);

    // Cutoff Validation: 48-hour rule for mentors
    const MENTOR_CANCEL_CUTOFF_HOURS = 48;
    const now = new Date();
    const diffInHours = (new Date(session.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffInHours < MENTOR_CANCEL_CUTOFF_HOURS) {
      logger.warn(`Mentor ${mentorId} cancellation rejected: Session ${sessionId} starts in ${diffInHours.toFixed(2)}h (Cutoff: ${MENTOR_CANCEL_CUTOFF_HOURS}h)`);
      throw new AppError(MESSAGES.SESSION.CANCEL_CUTOFF_ERROR, HttpStatusCode.BAD_REQUEST);
    }

    await this.sessionRepo.updateById(sessionId, {
      status: SESSION_STATUS.CANCELLED,
      cancelledBy: 'mentor',
      cancellationReason: reason
    });

    await this.bookingRepo.updateMany(
      { $or: [{ sessionId: session._id }, { timeSlotId: session.timeSlotId }] },
      { 
        status: BOOKING_STATUS.CANCELLED,
        rebookingRequired: true,
        rebookMentorId: session.mentorId 
      } as any
    );

    for (const participant of session.participants) {
      if (participant.role === 'student') {
        await this.notificationService.notifyUser(
          participant.userId.toString(),
          'student',
          'mentor_absence_reschedule',
          { sessionId, reason, message: `Your mentor has cancelled the session. Please choose another time slot with the same mentor.` },
          ['web', 'email']
        );
      }
    }
   
    await this.timeSlotRepo.releaseCapacity(session.timeSlotId.toString());
  }

  async resolveRescheduling(sessionId: string, studentId: string, newTimeSlotId?: string, slotDetails?: { date: string, startTime: string, endTime: string }): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error(MESSAGES.SESSION.NOT_FOUND);

    // Allow rescheduling if explicitly in 'rescheduling' state OR if it was 'cancelled' by the mentor
    const canReschedule = session.status === SESSION_STATUS.RESCHEDULING || 
                         (session.status === SESSION_STATUS.CANCELLED && session.cancelledBy === 'mentor');

    if (!canReschedule) {
      throw new AppError(MESSAGES.SESSION.INVALID_STATE, HttpStatusCode.BAD_REQUEST);
    }

    // Security check: ensure the student is part of this session
    const isParticipant = session.participants.some(participant => participant.userId.toString() === studentId);
    if (!isParticipant) throw new Error(MESSAGES.SESSION.ACCESS_DENIED);

    if (newTimeSlotId || slotDetails) {
      // RESCHEDULE CASE
      logger.info(`Student ${studentId} resolving rescheduling for session ${sessionId}`);

      let effectiveSlotId = newTimeSlotId;

      // If no direct ID but we have details (template slot), ensure concrete slot exists
      if (!effectiveSlotId && slotDetails) {
        const startParts = slotDetails.startTime.split(':');
        const endParts = slotDetails.endTime.split(':');
        
        const targetDate = new Date(slotDetails.date);
        
        const startParams = new Date(targetDate);
        startParams.setUTCHours(
          parseInt(startParts[0] || '0') - 5,  // Subtract 5 hours for IST offset
          parseInt(startParts[1] || '0') - 30,  // Subtract 30 minutes for IST offset
          0,
          0
        );

        const endParams = new Date(targetDate);
        endParams.setUTCHours(
          parseInt(endParts[0] || '0') - 5,
          parseInt(endParts[1] || '0') - 30,
          0,
          0
        );

        logger.info(`Converting IST to UTC: ${slotDetails.startTime} IST -> ${startParams.toISOString()}`);

        effectiveSlotId = await this.schedulingService.ensureTimeSlot(
          session.mentorId.toString(),
          startParams,
          endParams
        );
        logger.info(`Ensured/Created slot ${effectiveSlotId} for rescheduling`);
      }
      
      if (!effectiveSlotId) throw new Error(MESSAGES.SESSION.INVALID_STATE);

      const newSlot = await this.timeSlotRepo.findById(effectiveSlotId);
      if (!newSlot) throw new Error(MESSAGES.AVAILABILITY.SLOT_NOT_FOUND);
      
      // Conflict Validation: Is mentor already busy at this exact time?
      const existingConflict = await this.sessionRepo.find({
        mentorId: session.mentorId,
        startTime: newSlot.startTime,
        status: SESSION_STATUS.SCHEDULED
      });

      if (existingConflict.length > 0) {
        throw new AppError("Mentor has a conflicting session at this time.", HttpStatusCode.BAD_REQUEST);
      }

      if (newSlot.status !== 'available' && newSlot.status !== 'reserved') {
        throw new Error(MESSAGES.AVAILABILITY.SLOT_NOT_AVAILABLE);
      }

      // 1. Reserve and Confirm new slot
      const updatedSlot = await this.timeSlotRepo.reserveCapacity(effectiveSlotId);
      if (!updatedSlot) throw new Error("Failed to reserve slot capacity.");

      // 2. Create NEW session document for the rescheduled time
      const newSessionData: Partial<ISession> = {
        timeSlotId: new Types.ObjectId(effectiveSlotId) as unknown as import('mongoose').Schema.Types.ObjectId,
        mentorId: session.mentorId,
        subjectId: session.subjectId,
        sessionType: session.sessionType,
        participants: session.participants,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        status: SESSION_STATUS.SCHEDULED,
        isRescheduled: true,
        ...(session.studentId && { studentId: session.studentId }),
        ...(session.courseId && { courseId: session.courseId }),
        ...(session.enrollmentId && { enrollmentId: session.enrollmentId }),
      };
      const newSession = await this.sessionRepo.create(newSessionData);
      const newSessionId = (newSession as any)._id.toString();

      // 3. Mark OLD session as cancelled and link to the new one
      await this.sessionRepo.updateById(sessionId, {
        status: SESSION_STATUS.CANCELLED,
        cancelledBy: 'mentor',          // was cancelled by mentor originally
        isRescheduled: true,
        rescheduledTo: new Types.ObjectId(newSessionId) as unknown as import('mongoose').Schema.Types.ObjectId,
      });

      // 4. Update Booking to point at the new session's slot
      await this.bookingRepo.updateMany(
        { $or: [{ sessionId: session._id }, { timeSlotId: session.timeSlotId }], studentId: new Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId },
        { timeSlotId: new Types.ObjectId(effectiveSlotId) as unknown as import('mongoose').Schema.Types.ObjectId, sessionId: new Types.ObjectId(newSessionId) as unknown as import('mongoose').Schema.Types.ObjectId, status: BOOKING_STATUS.SCHEDULED }
      );

      // 4. Notify Mentor
      const subject = await this.subjectRepo.findById(session.subjectId?.toString() || "");
      const formattedTime = newSlot.startTime.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      await this.notificationService.notifyUser(
        session.mentorId.toString(),
        'mentor',
        'session_rescheduled',
        {
          sessionId,
          subjectName: subject?.subjectName || 'Session',
          startTime: formattedTime,
          message: `A student has rescheduled a session to a new time slot.`
        },
        ['web']
      );

    } else {
      // REFUND CASE
      logger.info(`Student ${studentId} requested refund for rescheduling session ${sessionId}`);

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
          logger.info(`Refund of ${refundAmount} for session ${sessionId} should be processed manually (Wallet system removed)`);
        }

        // 3. Update Booking Status
        await this.bookingRepo.updateById((booking as any)._id.toString(), { status: BOOKING_STATUS.CANCELLED });
      }

      // 4. Notify Mentor
      await this.notificationService.notifyUser(
        session.mentorId.toString(),
        'mentor',
        'session_cancelled_refund',
        {
          sessionId,
          message: `Student has chosen a refund instead of rescheduling.`
        },
        ['web']
      );
    }
  }

  async completeSession(sessionId: string, mentorId: string): Promise<ISession | null> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error(MESSAGES.SESSION.NOT_FOUND);

    // Authorization: Only the assigned mentor can complete the session
    if (session.mentorId.toString() !== mentorId) {
      throw new Error(MESSAGES.SESSION.ACCESS_DENIED);
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
