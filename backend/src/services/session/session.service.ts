import { injectable, inject } from "inversify";
import { TYPES } from "../../types.js";
import { logger } from "../../utils/logger.js";
import type { ISessionService, CreateSessionDto } from "../../interfaces/services/ISessionService.js";
import type { ISessionRepository } from "../../interfaces/repositories/ISessionRepository.js";
import type { SchedulingOrchestrator } from "../scheduling/SchedulingOrchestrator.js";
import type { IBooking } from "../../interfaces/models/booking.interface.js";
import type { SessionStatusType } from "../../domain/session/constants.js";
import { SessionStatus } from "../../domain/session/constants.js";
import type { SchedulingService } from "../scheduling.service.js";

@injectable()
export class SessionService implements ISessionService {
  constructor(
    @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
    @inject(TYPES.SchedulingOrchestrator) private _orchestrator: SchedulingOrchestrator,
   
    @inject(TYPES.ISchedulingService) private _schedulingService: SchedulingService
  ) {}

  async createSession(data: any): Promise<import('../../interfaces/models/session.interface.js').ISession> {
    logger.info(`Creating session for student ${data.studentId}`);
    // Extracting fields from CreateSessionDto or ISession partial
    const sessionData = {
      mentorId: data.mentorId,
      timeSlotId: data.timeSlotId || data.slotId, // flexibility for CreateSessionDto vs ISession
      studentId: data.studentId,
      courseId: data.courseId,
      enrollmentId: data.enrollmentId,
      subjectId: data.subjectId,
      startTime: data.startTime,
      endTime: data.endTime,
      sessionType: data.sessionType || 'one-to-one',
      status: 'scheduled' as const,
      participants: [
        { userId: data.studentId, role: 'student', status: 'scheduled' },
        { userId: data.mentorId, role: 'mentor', status: 'scheduled' }
      ]
    };
    return await this._sessionRepo.create(sessionData as any);
  }

  async cancelSession(sessionId: string, mentorId: string, reason: string): Promise<void> {
    logger.info(`Cancelling session ${sessionId}, reason: ${reason}`);
    await this._sessionRepo.updateStatus(sessionId, 'cancelled');
  }

  async updateSessionStatus(sessionId: string, status: string): Promise<import('../../interfaces/models/session.interface.js').ISession | null> {
    logger.info(`Updating session ${sessionId} status to ${status}`);
    return await this._sessionRepo.updateStatus(sessionId, status);
  }

  async getSessionById(sessionId: string): Promise<import('../../interfaces/models/session.interface.js').ISession | null> {
    return await this._sessionRepo.findById(sessionId);
  }

  async getStudentUpcomingSessions(studentId: string): Promise<import('../../interfaces/models/session.interface.js').ISession[]> {
    return await this._sessionRepo.findUpcomingByStudent(studentId);
  }

  // Missing implementations for other interface methods
  async getMentorUpcomingSessions(mentorId: string): Promise<any[]> { return []; }
  async getMentorTodaySessions(mentorId: string): Promise<any[]> { return []; }
  async findByStudentAndSubject(studentId: string, subjectId: string): Promise<any[]> { return []; }
  async updateStatus(id: string, status: string): Promise<any> { return null; }
  async syncSessionsFromSlots(slots: any[]): Promise<void> {}
  async reportAbsence(sessionId: string, studentId: string, reason: string): Promise<void> {}
  async resolveRescheduling(sessionId: string, studentId: string, newTimeSlotId?: string): Promise<void> {}
  async completeSession(sessionId: string, mentorId: string): Promise<any> { return null; }
  async activateJoinLinksForTimeWindow(from: Date, to: Date): Promise<void> {}
}
