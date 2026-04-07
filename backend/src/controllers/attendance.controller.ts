import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import type { IAttendanceService } from "@/interfaces/services/IAttendanceService";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { MESSAGES } from "@/constants/messages.constants";
import { UserRole } from "@/enums/user.enum";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class AttendanceController {
  constructor(
    @inject(TYPES.IAttendanceService)
    private _attendanceService: IAttendanceService
  ) {}

  async markPresent(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Session"), HttpStatusCode.BAD_REQUEST);
      }

      if (!userId) {
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      // Detect session model (Try Session first, then TrialClass)
      let sessionModel: 'Session' | 'TrialClass' = 'Session';
      const { SessionModel } = await import("../models/scheduling/session.model");
      const session = await SessionModel.findById(sessionId);
      
      if (!session) {
          const { TrialClass } = await import("../models/student/trialClass.model");
          const trial = await TrialClass.findById(sessionId);
          if (trial) {
              sessionModel = 'TrialClass';
          } else {
              throw new AppError(MESSAGES.COMMON.NOT_FOUND, HttpStatusCode.NOT_FOUND);
          }
      }

      const attendanceRecord = await this._attendanceService.markPresent(sessionId, userId as string, sessionModel);
      res.status(HttpStatusCode.OK).json({
          success: true,
          message: MESSAGES.ATTENDANCE.MARK_SUCCESS,
          data: attendanceRecord
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        logger.error("Error marking present:", error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.COMMON.INTERNAL_SERVER_ERROR });
      }
    }
  }

  async markAbsent(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!sessionId) {
        throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Session"), HttpStatusCode.BAD_REQUEST);
      }

      if (!userId) {
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      // Detect session model
      let sessionModel: 'Session' | 'TrialClass' = 'Session';
      const { SessionModel } = await import("../models/scheduling/session.model");
      const session = await SessionModel.findById(sessionId);
      
      if (!session) {
          const { TrialClass } = await import("../models/student/trialClass.model");
          const trial = await TrialClass.findById(sessionId);
          if (trial) {
              sessionModel = 'TrialClass';
          } else {
              throw new AppError(MESSAGES.COMMON.NOT_FOUND, HttpStatusCode.NOT_FOUND);
          }
      }

      const attendanceRecord = await this._attendanceService.markAbsent(sessionId, userId as string, sessionModel, reason || "No reason provided");
      res.status(HttpStatusCode.OK).json({
          success: true,
          message: MESSAGES.ATTENDANCE.MARK_SUCCESS,
          data: attendanceRecord
      });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        logger.error("Error marking absent:", error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: MESSAGES.COMMON.INTERNAL_SERVER_ERROR });
      }
    }
  }

  async getMyHistory(req: Request, res: Response): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = authReq.user?.id;
      const role = authReq.user?.role;

      if (!userId) {
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      let history;
      if (role === UserRole.MENTOR) {
        history = await this._attendanceService.getMentorHistory(userId);
      } else {
        history = await this._attendanceService.getStudentHistory(userId);
      }

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.ATTENDANCE.FETCH_SUCCESS,
        data: history,
      });
    } catch (error) {
      this._handleError(res, error, MESSAGES.ATTENDANCE.FETCH_FAILED);
    }
  }

  async getAllAttendance(req: Request, res: Response): Promise<void> {
    try {
      const history = await this._attendanceService.getAllAttendance();

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.ATTENDANCE.FETCH_SUCCESS,
        data: history,
      });
    } catch (error) {
      this._handleError(res, error, MESSAGES.ATTENDANCE.FETCH_FAILED);
    }
  }

  private _handleError(res: Response, error: unknown, defaultMessage: string): void {
    logger.error(defaultMessage, error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: defaultMessage 
      });
    }
  }
}
