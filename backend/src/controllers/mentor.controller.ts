import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response } from "express";
import type { IMentorService } from "../interfaces/services/IMentorService";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";

@injectable()
export class MentorController {
  constructor(
    @inject(TYPES.IMentorService) private _mentorService: IMentorService
  ) {}

  updateProfile = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        logger.error("updateProfile: Missing mentorId in request");
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid user authentication",
        });
      }

      logger.info(`Starting profile update for mentor: ${mentorId}`);

      const updatedData = { ...req.body };

      if (req.file) {
        updatedData.profilePicture = req.file;
        logger.debug(
          `Profile picture file received: ${req.file.originalname}, stored as: ${req.file.filename}`
        );
      }

      const updatedProfile = await this._mentorService.updateMentorProfile(
        mentorId,
        updatedData
      );

      logger.info(`Mentor profile updated successfully: ${mentorId}`);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(
        `Error in updateProfile for mentor ${req.user?.id}: ${error.message}`,
        { error: error.stack }
      );
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        logger.error("getProfile: Missing mentorId in request");
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid user authentication",
        });
      }

      logger.info(`Fetching profile for mentor: ${mentorId}`);
      const profile = await this._mentorService.getMentorProfile(mentorId);

      if (!profile) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: "Mentor profile not found",
        });
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: profile,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in getProfile for mentor ${req.user?.id}: ${error.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message || "Failed to fetch profile",
      });
    }
  };

  submitForApproval = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      const requestingUserId = req.user?.id;
      if (!mentorId || !requestingUserId) {
        logger.error(`submitForApproval: Missing mentorId or requestingUserId`);
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Invalid user" });
      }

      const result = await this._mentorService.submitProfileForApproval(
        mentorId,
        requestingUserId
      );
      logger.info(`Mentor ${mentorId} submitted profile for approval`);
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in submitForApproval: ${error.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  };

  getPending = async (req: Request, res: Response) => {
    try {
      const pending = await this._mentorService.getPendingMentors();
      logger.info(`Fetched ${pending.length} pending mentors`);
      return res
        .status(HttpStatusCode.OK)
        .json({ success: true, data: pending });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in getPending: ${error.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  };

  approve = async (req: Request, res: Response) => {
    try {
      const mentorId = req.params.mentorId;
      const adminId = req.user?.id;

      if (!mentorId || !adminId) {
        logger.error("approve: Missing mentorId or adminId");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Invalid request" });
      }

      const result = await this._mentorService.approveMentor(mentorId, adminId);
      logger.info(`Mentor approved: ${mentorId} by admin: ${adminId}`);
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`approve error: ${error.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  };

  reject = async (req: Request, res: Response) => {
    try {
      const mentorId = req.params.mentorId;
      const adminId = req.user?.id;
      const { reason } = req.body;

      if (!mentorId || !adminId || !reason) {
        logger.error("reject: Missing mentorId, adminId, or reason");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Invalid request" });
      }

      const result = await this._mentorService.rejectMentor(
        mentorId,
        reason,
        adminId
      );

      logger.info(
        `Mentor rejected: ${mentorId} by admin: ${adminId}, reason: ${reason}`
      );
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`reject error: ${error.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  };
  getTrialClasses = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        logger.error("getTrialClasses: Missing mentorId");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Invalid user" });
      }

      const trialClasses = await this._mentorService.getMentorTrialClasses(mentorId);
      logger.info(`Fetched ${trialClasses.length} trial classes for mentor ${mentorId}`);
      return res.status(HttpStatusCode.OK).json({ success: true, data: trialClasses });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in getTrialClasses: ${error.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  };

  getAvailableSlots = async (req: Request, res: Response) => {
    try {
      const mentorId = req.params.mentorId;
      if (!mentorId) {
        logger.error("getAvailableSlots: Missing mentorId");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: "Mentor ID is required" });
      }

      const slots = await this._mentorService.getMentorAvailableSlots(mentorId);
      logger.info(`Fetched available slots for mentor ${mentorId}`);
      return res.status(HttpStatusCode.OK).json({ success: true, data: slots });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in getAvailableSlots: ${error.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: error.message });
    }
  };

  requestLeave = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      }

      const { startDate, endDate, reason } = req.body;
      if (!startDate || !endDate) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: "Dates are required" });
      }

      await this._mentorService.requestLeave(mentorId, new Date(startDate), new Date(endDate), reason);
      return res.status(HttpStatusCode.OK).json({ success: true, message: "Leave requested successfully" });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  };

  approveLeave = async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      const { mentorId, leaveId } = req.params;

      if (!adminId || !mentorId || !leaveId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: "Missing required params" });
      }

      await this._mentorService.approveLeave(mentorId, leaveId, adminId);
      return res.status(HttpStatusCode.OK).json({ success: true, message: "Leave approved successfully" });
    } catch (err: unknown) {
      const error = err as Error;
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  };

  getDailySessions = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      }

      // Default to today if no date provided
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      if (isNaN(date.getTime())) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: "Invalid date format" });
      }

      const sessions = await this._mentorService.getMentorDailySessions(mentorId, date);
      
      return res.status(HttpStatusCode.OK).json({ success: true, data: sessions });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in getDailySessions: ${error.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  };

  // Get only one-to-one students
  getOneToOneStudents = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      }

      const students = await this._mentorService.getOneToOneStudents(mentorId);
      return res.status(HttpStatusCode.OK).json({ success: true, data: students });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in getOneToOneStudents: ${error.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  };

  // Get only group batches
  getGroupBatches = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: "Unauthorized" });
      }

      const batches = await this._mentorService.getGroupBatches(mentorId);
      return res.status(HttpStatusCode.OK).json({ success: true, data: batches });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Error in getGroupBatches: ${error.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  };
}
