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
}
