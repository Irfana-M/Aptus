import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { Request, Response } from "express";
import type { IMentorDashboardService } from "@/interfaces/services/IMentorDashboardService";
import { HttpStatusCode } from "@/constants/httpStatus";
import { AppError } from "@/utils/AppError";
import { logger } from "@/utils/logger";

@injectable()
export class MentorDashboardController {
  constructor(@inject(TYPES.IMentorDashboardService) private dashboardService: IMentorDashboardService) {}

  getDashboardData = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user!.id;
      const dashboardData = await this.dashboardService.getDashboardData(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: dashboardData, message: "Dashboard data retrieved successfully" });
    } catch (error: unknown) {
      logger.error("Error getting dashboard data", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({ success: false, message });
    }
  };

  getAssignedStudents = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user!.id;
      const { page = 1, limit = 10 } = req.query;
      const students = await this.dashboardService.getAssignedStudents(mentorId, Number(page), Number(limit));
      res.status(HttpStatusCode.OK).json({ success: true, data: students, message: "Assigned students retrieved successfully" });
    } catch (error: unknown) {
      logger.error("Error getting assigned students", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({ success: false, message });
    }
  };

  getTodaySessions = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user!.id;
      const sessions = await this.dashboardService.getTodaySessions(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: sessions, message: "Today's sessions retrieved successfully" });
    } catch (error: unknown) {
      logger.error("Error getting today's sessions", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({ success: false, message });
    }
  };

  getRecentActivities = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user!.id;
      const { limit = 10 } = req.query;
      const activities = await this.dashboardService.getRecentActivities(mentorId, Number(limit));
      res.status(HttpStatusCode.OK).json({ success: true, data: activities, message: "Recent activities retrieved successfully" });
    } catch (error: unknown) {
      logger.error("Error getting recent activities", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : "Internal server error";
      res.status(status).json({ success: false, message });
    }
  };
}