import { injectable, inject } from "inversify";
import { TYPES } from "@/types.js";
import type { Request, Response } from "express";
import type { IMentorDashboardService } from "@/interfaces/services/IMentorDashboardService.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { AppError } from "@/utils/AppError.js";
import { logger } from "@/utils/logger.js";
import { MESSAGES } from "@/constants/messages.constants.js";
import { UserRole } from "@/enums/user.enum.js";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class MentorDashboardController {
  constructor(@inject(TYPES.IMentorDashboardService) private _dashboardService: IMentorDashboardService) {}

  getDashboardData = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const mentorId = authReq.user!.id;
      const dashboardData = await this._dashboardService.getDashboardData(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: dashboardData, message: MESSAGES.ADMIN.DASHBOARD_FETCH_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error getting dashboard data", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  getAssignedStudents = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const mentorId = authReq.user!.id;
      const { page = 1, limit = 10 } = req.query;
      const students = await this._dashboardService.getAssignedStudents(mentorId, Number(page), Number(limit));
      res.status(HttpStatusCode.OK).json({ success: true, data: students, message: MESSAGES.ADMIN.STUDENTS_FETCH_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error getting assigned students", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  getTodaySessions = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const mentorId = authReq.user!.id;
      const sessions = await this._dashboardService.getTodaySessions(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: sessions, message: MESSAGES.ADMIN.FETCH_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error getting today's sessions", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  getRecentActivities = async (req: Request, res: Response) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const mentorId = authReq.user!.id;
      const { limit = 10 } = req.query;
      const activities = await this._dashboardService.getRecentActivities(mentorId, Number(limit));
      res.status(HttpStatusCode.OK).json({ success: true, data: activities, message: MESSAGES.ADMIN.FETCH_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error getting recent activities", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };
}