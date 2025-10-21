import type { Request, Response, NextFunction } from "express";
import type { IAdminService } from "../interfaces/services/IAdminService.js";
import { logger } from "../utils/logger.js";
import { HttpStatusCode } from "../constants/httpStatus.js";

export class AdminController {
  constructor(private _adminService: IAdminService) {}

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      logger.info(`Admin login attempt: ${email}`);

      const result = await this._adminService.login(email, password);

      logger.info(`Admin login successful: ${email}`);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(`Admin login failed: ${req.body.email} - ${error.message}`);
      res.status(HttpStatusCode.UNAUTHORIZED).json({ message: error.message });
    }
  };

  getDashboardData = async (_req: Request, res: Response) => {
    try {
      logger.info("Fetching dashboard data");
      const data = await this._adminService.getDashboardData();
      logger.info("Dashboard data fetched successfully");
      res.status(HttpStatusCode.OK).json(data);
    } catch (error: any) {
      logger.error(`Error fetching dashboard data: ${error.message}`);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };

  getMentorProfile = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: "Mentor ID is required" });
    }
    try {
      logger.info(`Fetching mentor profile: ${mentorId}`);
      const mentor = await this._adminService.fetchMentorProfile(mentorId);
      if (!mentor) {
        logger.warn(`Mentor not found: ${mentorId}`);
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Mentor not found" });
      }
      logger.info(`Mentor profile fetched: ${mentorId}`);
      res.status(HttpStatusCode.OK).json(mentor);
    } catch (error: any) {
      logger.error(
        `Error fetching mentor profile ${mentorId}: ${error.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };

  approveMentor = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: "Mentor ID is required" });
    }
    const adminId = req.user?.id;
    if (!adminId) {
      logger.warn("Admin ID is missing in request");
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    try {
      logger.info(`Admin ${adminId} approving mentor: ${mentorId}`);
      const result = await this._adminService.updateMentorApprovalStatus(
        mentorId,
        "approved",
        adminId
      );
      logger.info(`Mentor ${mentorId} approved by admin ${adminId}`);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(
        `Error approving mentor ${mentorId} by admin ${adminId}: ${error.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };

  rejectMentor = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: "Mentor ID is required" });
    }
    const { reason } = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
      logger.warn("Admin ID is missing in request");
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    try {
      logger.info(
        `Admin ${adminId} rejecting mentor: ${mentorId}, Reason: ${reason}`
      );
      const result = await this._adminService.updateMentorApprovalStatus(
        mentorId,
        "rejected",
        adminId,
        reason
      );
      logger.info(`Mentor ${mentorId} rejected by admin ${adminId}`);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(
        `Error rejecting mentor ${mentorId} by admin ${adminId}: ${error.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };
}
