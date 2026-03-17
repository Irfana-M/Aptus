import type { Request, Response, NextFunction } from "express";
import type { ISessionService } from "../interfaces/services/ISessionService.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { AppError } from "../utils/AppError.js";
import { MESSAGES } from "../constants/messages.constants.js";
import { getPaginationParams, formatStandardizedPaginatedResult } from "../utils/pagination.util.js";
import { logger } from "../utils/logger.js";

export class SessionController {
  constructor(private _sessionService: ISessionService) {}

  async getStudentUpcomingSessions(req: Request, res: Response, next: NextFunction) {
      try {
        if (!req.user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
        const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
        logger.info(`📡 [API] Fetching upcoming sessions for student ${req.user.id}`);
        const { items, total } = await this._sessionService.getStudentUpcomingSessionsPaginated(req.user.id, page, limit);
        logger.info(`✅ [API] Returning ${items.length} sessions for student ${req.user.id}`);
        res.status(HttpStatusCode.OK).json(
          formatStandardizedPaginatedResult(items, total, { page, limit }, MESSAGES.COMMON.DATA_FETCHED)
        );
      } catch (error) {
          next(error);
      }
  }

  async getMentorUpcomingSessions(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
          const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
          logger.info(`📡 [API] Fetching upcoming sessions for mentor ${req.user.id}`);
          const { items, total } = await this._sessionService.getMentorUpcomingSessionsPaginated(req.user.id, page, limit);
          logger.info(`✅ [API] Returning ${items.length} sessions for mentor ${req.user.id}`);
          res.status(HttpStatusCode.OK).json(
            formatStandardizedPaginatedResult(items, total, { page, limit }, MESSAGES.COMMON.DATA_FETCHED)
          );
      } catch (error) {
          next(error);
      }
  }

  async getMentorTodaySessions(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
          logger.info(`📡 [API] Fetching today's sessions for mentor ${req.user.id}`);
          const sessions = await this._sessionService.getMentorTodaySessions(req.user.id);
          logger.info(`✅ [API] Returning ${sessions.length} today sessions for mentor ${req.user.id}`);
          res.status(HttpStatusCode.OK).json({ success: true, data: sessions });
      } catch (error) {
          next(error);
      }
  }

  async reportAbsence(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
          const sessionId = req.params.sessionId as string;
          const { reason } = req.body as { reason: string };
          
          const userId = req.user.id;
          
          await this._sessionService.reportAbsence(sessionId, userId, reason);
          res.status(HttpStatusCode.OK).json({ success: true, message: MESSAGES.SESSION.ABSENCE_REPORTED });
      } catch (error) {
          next(error);
      }
  }

  async cancelSession(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
          const sessionId = req.params.sessionId as string;
          const { reason } = req.body as { reason: string };
          
          const userId = req.user.id;
          
          await this._sessionService.cancelSession(sessionId, userId, reason);
          res.status(HttpStatusCode.OK).json({ success: true, message: MESSAGES.SESSION.CANCELLED });
      } catch (error) {
          next(error);
      }
  }

  async resolveRescheduling(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
          const sessionId = req.params.sessionId as string;
          // Extract newTimeSlotId and optional details for fallback creation
          const { newTimeSlotId, date, startTime, endTime } = req.body as { 
              newTimeSlotId?: string;
              date?: string;
              startTime?: string;
              endTime?: string;
          };
          
          const userId = req.user.id;
          
          let slotDetails = undefined;
          if (!newTimeSlotId && date && startTime && endTime) {
              slotDetails = { date, startTime, endTime };
          }

          await this._sessionService.resolveRescheduling(sessionId, userId, newTimeSlotId, slotDetails);
          res.status(HttpStatusCode.OK).json({ 
              success: true, 
              message: (newTimeSlotId || slotDetails) ? MESSAGES.SESSION.RESCHEDULED : MESSAGES.SESSION.REFUND_PROCESSED
          });
      } catch (error) {
          next(error);
      }
  }

  async completeSession(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
          const sessionId = req.params.sessionId as string;
          const mentorId = req.user.id;
          
          const session = await this._sessionService.completeSession(sessionId, mentorId);
          res.status(HttpStatusCode.OK).json({ 
              success: true, 
              message: MESSAGES.SESSION.COMPLETED,
              data: session 
          });
      } catch (error) {
          next(error);
      }
  }
}
