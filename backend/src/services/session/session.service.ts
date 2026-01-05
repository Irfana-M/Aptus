import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/AppError";
import { HttpStatusCode } from "../../constants/httpStatus";
import type { ISessionService, CreateSessionDto } from "../../interfaces/services/ISessionService";
import type { ISessionRepository } from "../../interfaces/repositories/ISessionRepository";
import type { SchedulingOrchestrator } from "../scheduling/SchedulingOrchestrator";
import type { IBooking } from "../../interfaces/models/booking.interface";
import type { SessionStatusType } from "../../domain/session/constants";
import { SessionStatus } from "../../domain/session/constants";
import type { SchedulingService } from "../scheduling.service";

@injectable()
export class SessionService implements ISessionService {
  constructor(
    @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
    @inject(TYPES.SchedulingOrchestrator) private _orchestrator: SchedulingOrchestrator,
    // Injecting SchedulingService for cancellation logic reuse if needed, or we implement here
    // For specific cancellation logic involving transactions and slots, it lives in SchedulingService currently.
    // We should ideally call SchedulingService to maintain the transactional integrity for now, OR refactor it here.
    // Given constraints "Do NOT delete existing...", reusing is safest.
    @inject(TYPES.ISchedulingService) private _schedulingService: SchedulingService
  ) {}

  async createSession(data: CreateSessionDto): Promise<IBooking> {
    logger.info(`Creating session (booking) for student ${data.studentId} in slot ${data.slotId}`);
    return await this._orchestrator.bookSession(data.studentId, data.slotId, data.studentSubjectId);
  }

  async cancelSession(sessionId: string, reason?: string): Promise<void> {
    logger.info(`Cancelling session ${sessionId}, reason: ${reason}`);
    // Delegate to existing SchedulingService which handles transaction and slot updates
    await this._schedulingService.cancelBooking(sessionId, reason);
    
    // If not using SchedulingService, we would need to replicate the transaction logic here:
    // 1. Get Booking
    // 2. Update Booking Status
    // 3. Update TimeSlot (increment count, set status)
  }

  async updateSessionStatus(sessionId: string, status: SessionStatusType): Promise<IBooking | null> {
    logger.info(`Updating session ${sessionId} status to ${status}`);
    
    // For simple status updates that don't involve slot capacity (e.g. absent, completed)
    // acts directly on valid session repo (booking repo wrapper)
    
    // If status is CANCELLED, we must use cancelSession logic to free up slot
    if (status === SessionStatus.CANCELLED) {
        await this.cancelSession(sessionId, "Updated status to cancelled");
        return await this._sessionRepo.findById(sessionId);
    }
    
    // For other statuses (completed, absent)
    return await this._sessionRepo.update(sessionId, { status });
  }

  async getSessionById(sessionId: string): Promise<IBooking | null> {
    return await this._sessionRepo.findById(sessionId);
  }

  async getStudentSessions(studentId: string): Promise<IBooking[]> {
    return await this._sessionRepo.findByStudent(studentId);
  }
}
