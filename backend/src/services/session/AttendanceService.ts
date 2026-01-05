import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/AppError";
import { HttpStatusCode } from "../../constants/httpStatus";
import type { IAttendanceService } from "../../interfaces/services/IAttendanceService";
import type { ISessionService } from "../../interfaces/services/ISessionService";
import type { IBooking } from "../../interfaces/models/booking.interface";
import { SessionStatus } from "../../domain/session/constants";
import type { SessionAttendancePolicy } from "../../domain/policy/SessionAttendancePolicy";

@injectable()
export class AttendanceService implements IAttendanceService {
  constructor(
    @inject(TYPES.ISessionService) private _sessionService: ISessionService,
    @inject(TYPES.SessionAttendancePolicy) private _policy: SessionAttendancePolicy
  ) {}

  async markPresent(sessionId: string): Promise<IBooking> {
    logger.info(`Marking session ${sessionId} as present (completed)`);
    const session = await this._sessionService.getSessionById(sessionId);
    if (!session) {
      throw new AppError("Session not found", HttpStatusCode.NOT_FOUND);
    }

    this._policy.canMarkPresent(session);

    // In a real system, "Present" might be distinct from "Completed" (which implies over),
    // but mapping to legacy status:
    const updated = await this._sessionService.updateSessionStatus(sessionId, SessionStatus.COMPLETED);
    if (!updated) throw new AppError("Failed to update session status", HttpStatusCode.INTERNAL_SERVER_ERROR);
    
    return updated;
  }

  async markAbsent(sessionId: string, reason?: string): Promise<IBooking> {
    logger.info(`Marking session ${sessionId} as absent. Reason: ${reason}`);
    const session = await this._sessionService.getSessionById(sessionId);
    if (!session) {
      throw new AppError("Session not found", HttpStatusCode.NOT_FOUND);
    }

    this._policy.canMarkAbsent(session);

    const updated = await this._sessionService.updateSessionStatus(sessionId, SessionStatus.ABSENT);
    if (!updated) throw new AppError("Failed to update session status", HttpStatusCode.INTERNAL_SERVER_ERROR);

    return updated;
  }
}
