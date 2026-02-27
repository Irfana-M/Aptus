import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { ISessionService } from "../interfaces/services/ISessionService";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository";
import type { ISession } from "../interfaces/models/session.interface";
import type { INotificationService } from "../interfaces/services/INotificationService";
import type { ISchedulingService } from "../interfaces/services/ISchedulingService";
import type { IAttendanceService } from "../interfaces/services/IAttendanceService";

import type { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import type { ISubjectRepository } from "../interfaces/repositories/ISubjectRepository";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import { logger } from "../utils/logger";
import { Types } from "mongoose";

@injectable()
export class SessionService implements ISessionService {
  constructor(
    @inject(TYPES.ISessionRepository) private sessionRepo: ISessionRepository,
    @inject(TYPES.ITimeSlotRepository) private timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.IBookingRepository) private bookingRepo: IBookingRepository,
    @inject(TYPES.ISubjectRepository) private subjectRepo: ISubjectRepository,
    @inject(TYPES.IStudentRepository) private studentRepo: IStudentRepository,
    @inject(TYPES.INotificationService) private notificationService: INotificationService,
    @inject(TYPES.ISchedulingService) private schedulingService: ISchedulingService,
    @inject(TYPES.IAttendanceService) private attendanceService: IAttendanceService
  ) {}

  async getStudentUpcomingSessions(studentId: string): Promise<ISession[]> {
    const sessions = await this.sessionRepo.findUpcomingByStudent(studentId);
    return sessions;
  }

  async getMentorUpcomingSessions(mentorId: string): Promise<ISession[]> {
    return this.sessionRepo.findUpcomingByMentor(mentorId);
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

  // Helper to sync sessions from slots (if somehow missing)
  async syncSessionsFromSlots(slots: Array<{ _id: string; mentorId: string; startTime: Date; endTime: Date }>): Promise<void> {
    try {
        logger.info(`[SessionService] Syncing ${slots.length} slots into Sessions...`);
        
        for (const slot of slots) {
             const booking = await this.bookingRepo.findOne({ timeSlotId: slot._id, status: 'scheduled' });
             if (!booking) continue;

             const existingSession = await this.sessionRepo.existsByTimeSlot(slot._id);
             if (!existingSession) {
                 logger.info(`Creating missing session for slot ${slot._id}`);
                 await this.sessionRepo.create({
                     mentorId: new Types.ObjectId(slot.mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
                     timeSlotId: new Types.ObjectId(slot._id.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
                     startTime: slot.startTime,
                     endTime: slot.endTime,
                     status: 'scheduled',
                     participants: [{ userId: new Types.ObjectId(booking.studentId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId, role: 'student' }]
                 });
             }
        }
    } catch (error) {
        logger.error(`Error syncing sessions from slots: ${error}`);
    }
  }

  async findByStudentAndSubject(studentId: string, subjectId: string): Promise<ISession[]> {
      // Logic to find sessions for a specific student & subject
      // Mongoose repository call
      return this.sessionRepo.findByStudentAndSubject(studentId, subjectId);
  }

  async updateStatus(id: string, status: string): Promise<ISession | null> {
      return this.sessionRepo.updateStatus(id, status);
  }

  async reportAbsence(sessionId: string, studentId: string, reason: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error("Session not found");
    
    // Authorization check
    const isParticipant = session.participants.some(p => p.userId.toString() === studentId);
    if (!isParticipant) throw new Error("Unauthorized");

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

    // Logic: mark as Rescheduling, notify mentor
    await this.sessionRepo.updateStatus(sessionId, 'rescheduling');
    
    await this.notificationService.notifyUser(
        session.mentorId.toString(), 
        'mentor', 
        'student_absence', 
        { 
            sessionId, 
            studentId,
            studentName: student?.fullName || 'Student',
            subjectName: subject?.subjectName || 'Session',
            sessionDate,
            sessionTime,
            reason,
            message: `${student?.fullName || 'A student'} reported absence for ${subject?.subjectName || 'your session'} on ${sessionDate} at ${sessionTime}. Reason: ${reason}`
        },
        ['web', 'email']
    );

    // Release capacity so rescheduling can happen cleanly
    await this.timeSlotRepo.releaseCapacity(session.timeSlotId.toString());
  }

  async cancelSession(sessionId: string, mentorId: string, reason: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error("Session not found");

    if (session.mentorId.toString() !== mentorId) throw new Error("Unauthorized");

    await this.sessionRepo.updateStatus(sessionId, 'rescheduling');

    // Notify student
    const student = session.participants.find(p => p.role === 'student');
    if (student) {
        await this.notificationService.notifyUser(
            student.userId.toString(),
            'student',
            'mentor_absence_reschedule',
            { sessionId, reason, message: `Mentor cancelled session: ${reason}. Please reschedule.` },
            ['web', 'email']
        );
    }
   
    await this.timeSlotRepo.releaseCapacity(session.timeSlotId.toString());
  }

  async resolveRescheduling(sessionId: string, studentId: string, newTimeSlotId?: string, slotDetails?: { date: string, startTime: string, endTime: string }): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) throw new Error("Session not found");

    if (session.status !== 'rescheduling') {
        throw new Error("Session is not in rescheduling state");
    }

    // Security check: ensure the student is part of this session
    const isParticipant = session.participants.some(p => p.userId.toString() === studentId);
    if (!isParticipant) throw new Error("Unauthorized: You are not a participant in this session");

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
        
        if (!effectiveSlotId) throw new Error("Failed to resolve time slot for rescheduling");

        const newSlot = await this.timeSlotRepo.findById(effectiveSlotId);
        if (!newSlot) throw new Error("New time slot not found");
        if (newSlot.status !== 'available') throw new Error("Selected time slot is no longer available");

        // 1. Reserve new slot
        await this.timeSlotRepo.reserveSlot(effectiveSlotId);

        // 2. Update Session
        await this.sessionRepo.updateById(sessionId, {
            timeSlotId: new Types.ObjectId(effectiveSlotId) as unknown as import('mongoose').Schema.Types.ObjectId,
            startTime: newSlot.startTime,
            endTime: newSlot.endTime,
            status: 'scheduled'
        });

        // 3. Update Booking
        await this.bookingRepo.updateMany(
            { $or: [{ sessionId: session._id }, { timeSlotId: session.timeSlotId }], studentId: new Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId },
            { timeSlotId: new Types.ObjectId(effectiveSlotId) as unknown as import('mongoose').Schema.Types.ObjectId, status: 'scheduled' }
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
        await this.sessionRepo.updateStatus(sessionId, 'cancelled');

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
            await this.bookingRepo.updateById((booking as any)._id.toString(), { status: 'cancelled' });
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
    if (!session) throw new Error("Session not found");

    // Authorization: Only the assigned mentor can complete the session
    if (session.mentorId.toString() !== mentorId) {
        throw new Error("Unauthorized: Only the assigned mentor can complete this session");
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
            const studentId = updatedSession.participants.find(p => p.role === 'student')?.userId.toString();
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
      const { SessionAccessService } = await import('./scheduling/SessionAccessService');
      const sessionAccessService = new SessionAccessService();

      // 1. Find booked slots in the time window
      const slots = await this.timeSlotRepo.find({
        startTime: { $gte: from, $lte: to },
        status: 'booked'
      });

      // 2. Sync sessions from slots (ensure Session records exist)
      await this.syncSessionsFromSlots(slots.map(s => ({
        _id: (s as unknown as { _id: { toString(): string } })._id.toString(),
        mentorId: s.mentorId.toString(),
        startTime: s.startTime,
        endTime: s.endTime
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
        } catch (err) {
          logger.error(`[SessionService] Error processing slot ${slot._id}:`, err);
        }
      }

      logger.info(`[SessionService] Completed join link activation for ${slots.length} slots`);
    } catch (error) {
      logger.error(`[SessionService] Error in activateJoinLinksForTimeWindow:`, error);
      throw error;
    }
  }


}
