import type { Request, Response } from "express";
import type { IMentorService } from "../interfaces/services/IMentorService.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { logger } from "../utils/logger.js";
 

export class MentorController {
  constructor(private readonly _mentorService: IMentorService) {}


updateProfile = async (req: Request, res: Response) => {
  try {
    const mentorId = req.user?.id;
    if (!mentorId) {
      logger.error("updateProfile: Missing mentorId in request");
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Invalid user authentication"
      });
    }

    logger.info(`Starting profile update for mentor: ${mentorId}`);

    const updatedData = { ...req.body };

    // Check if file exists and add it to updatedData
    if (req.file) {
      updatedData.profilePicture = req.file; // Use filename for storage path
      logger.debug(`Profile picture file received: ${req.file.originalname}, stored as: ${req.file.filename}`);
    }

    // Move the update outside the if condition so it happens regardless of file upload
    const updatedProfile = await this._mentorService.updateMentorProfile(mentorId, updatedData);

    logger.info(`Mentor profile updated successfully: ${mentorId}`);
    return res.status(HttpStatusCode.OK).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile
    });

  } catch (err: any) {
    logger.error(`Error in updateProfile for mentor ${req.user?.id}: ${err.message}`, { error: err.stack });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || "Failed to update profile"
    });
  }
};

  submitForApproval = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      const requestingUserId = req.user?.id; 
      if (!mentorId || !requestingUserId) {
        logger.error(`submitForApproval: Missing mentorId or requestingUserId`);
        return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: "Invalid user" });
      }

      const result = await this._mentorService.submitProfileForApproval(mentorId, requestingUserId);
      logger.info(`Mentor ${mentorId} submitted profile for approval`);
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (err: any) {
      logger.error(`Error in submitForApproval: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  getPending = async (req: Request, res: Response) => {
    try {
      const pending = await this._mentorService.getPendingMentors();
      logger.info(`Fetched ${pending.length} pending mentors`);
      return res.status(HttpStatusCode.OK).json({ success: true, data: pending });
    } catch (err: any) {
      logger.error(`Error in getPending: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
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
    } catch (err: any) {
      logger.error(`approve error: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
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

      logger.info(`Mentor rejected: ${mentorId} by admin: ${adminId}, reason: ${reason}`);
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (err: any) {
      logger.error(`reject error: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  };
}
