import type { Request, Response, NextFunction } from "express";
import type { ISessionService } from "../interfaces/services/ISessionService";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";

export class SessionController {
  constructor(private sessionService: ISessionService) {}

  async getStudentUpcomingSessions(req: Request, res: Response, next: NextFunction) {
      try {
        if (!req.user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
        const sessions = await this.sessionService.getStudentUpcomingSessions(req.user.id);
        res.status(HttpStatusCode.OK).json({ success: true, data: sessions });
      } catch (error) {
          next(error);
      }
  }

  async getMentorUpcomingSessions(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
          const sessions = await this.sessionService.getMentorUpcomingSessions(req.user.id);
          res.status(HttpStatusCode.OK).json({ success: true, data: sessions });
      } catch (error) {
          next(error);
      }
  }

  async getMentorTodaySessions(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
          const sessions = await this.sessionService.getMentorTodaySessions(req.user.id);
          res.status(HttpStatusCode.OK).json({ success: true, data: sessions });
      } catch (error) {
          next(error);
      }
  }

  async reportAbsence(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
          const sessionId = req.params.sessionId as string;
          const { reason } = req.body as { reason: string };
          
          const userId = req.user.id;
          
          await this.sessionService.reportAbsence(sessionId, userId, reason);
          res.status(HttpStatusCode.OK).json({ success: true, message: "Absence reported successfully" });
      } catch (error) {
          next(error);
      }
  }

  async cancelSession(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
          const sessionId = req.params.sessionId as string;
          const { reason } = req.body as { reason: string };
          
          const userId = req.user.id;
          
          await this.sessionService.cancelSession(sessionId, userId, reason);
          res.status(HttpStatusCode.OK).json({ success: true, message: "Session cancelled successfully" });
      } catch (error) {
          next(error);
      }
  }

  async resolveRescheduling(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
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

          await this.sessionService.resolveRescheduling(sessionId, userId, newTimeSlotId, slotDetails);
          res.status(HttpStatusCode.OK).json({ 
              success: true, 
              message: (newTimeSlotId || slotDetails) ? "Session rescheduled successfully" : "Refund processed successfully" 
          });
      } catch (error) {
          next(error);
      }
  }

  async completeSession(req: Request, res: Response, next: NextFunction) {
      try {
          if (!req.user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
          const sessionId = req.params.sessionId as string;
          const mentorId = req.user.id;
          
          const session = await this.sessionService.completeSession(sessionId, mentorId);
          res.status(HttpStatusCode.OK).json({ 
              success: true, 
              message: "Session completed successfully",
              data: session 
          });
      } catch (error) {
          next(error);
      }
  }
}
