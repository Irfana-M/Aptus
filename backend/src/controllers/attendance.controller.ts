import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import type { IAttendanceService } from "@/interfaces/services/IAttendanceService";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";

@injectable()
export class AttendanceController {
  constructor(
    @inject(TYPES.IAttendanceService)
    private attendanceService: IAttendanceService
  ) {}

  async markPresent(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const userId = req.user?.id;

      if (!sessionId) {
        throw new AppError("Session ID is required", HttpStatusCode.BAD_REQUEST);
      }

      if (!userId) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
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
              throw new AppError("Session or Trial Class not found", HttpStatusCode.NOT_FOUND);
          }
      }

      const attendance = await this.attendanceService.markPresent(sessionId, userId as string, sessionModel);
      res.status(HttpStatusCode.OK).json(attendance);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        logger.error("Error marking present:", error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
      }
    }
  }

  async markAbsent(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!sessionId) {
        throw new AppError("Session ID is required", HttpStatusCode.BAD_REQUEST);
      }

      if (!userId) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
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
              throw new AppError("Session or Trial Class not found", HttpStatusCode.NOT_FOUND);
          }
      }

      const attendance = await this.attendanceService.markAbsent(sessionId, userId as string, sessionModel, reason || "No reason provided");
      res.status(HttpStatusCode.OK).json(attendance);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        logger.error("Error marking absent:", error);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
      }
    }
  }

  async getMyHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const role = req.user?.role;

      if (!userId) {
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED);
      }

      let history;
      if (role === 'mentor') {
        history = await this.attendanceService.getMentorHistory(userId);
      } else {
        history = await this.attendanceService.getStudentHistory(userId);
      }

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Attendance history fetched successfully",
        data: history,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch attendance history");
    }
  }

  async getAllAttendance(req: Request, res: Response): Promise<void> {
    try {
      const history = await this.attendanceService.getAllAttendance();

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "All attendance history fetched successfully",
        data: history,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch all attendance history");
    }
  }

  private handleError(res: Response, error: unknown, defaultMessage: string): void {
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
