import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { Request, Response } from "express";
import type { ITrialClassService } from "@/interfaces/services/ITrialClassService";
import { logger } from "@/utils/logger";
import { HttpStatusCode } from "@/constants/httpStatus";
import { AppError } from "@/utils/AppError";

@injectable()
export class MentorTrialClassController {
  constructor(@inject(TYPES.ITrialClassService) private trialClassService: ITrialClassService) {}

  getMentorTrialClasses = async (req: Request, res: Response): Promise<void> => {
    try {
      const mentorId = req.user!.id;
      const trialClasses = await this.trialClassService.getMentorTrialClasses(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: trialClasses, message: "Trial classes retrieved successfully" });
    } catch (error: any) {
      logger.error("Error getting mentor trial classes", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message: error.message || "Internal server error" });
    }
  };

  getTodayTrialClasses = async (req: Request, res: Response): Promise<void> => {
    try {
      const mentorId = req.user!.id;
      const todayTrialClasses = await this.trialClassService.getTodayTrialClasses(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: todayTrialClasses, message: "Today's trial classes retrieved successfully" });
    } catch (error: any) {
      logger.error("Error getting today's trial classes", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message: error.message || "Internal server error" });
    }
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const mentorId = req.user!.id;
      const stats = await this.trialClassService.getTrialClassStats(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: stats, message: "Trial class statistics retrieved successfully" });
    } catch (error: any) {
      logger.error("Error getting trial class stats", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message: error.message || "Internal server error" });
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      if (!id) throw new AppError("Trial class ID is required", HttpStatusCode.BAD_REQUEST);
      if (!status) throw new AppError("Status is required", HttpStatusCode.BAD_REQUEST);

      const updatedTrialClass = await this.trialClassService.updateTrialClassStatus(id, status, reason);
      res.status(HttpStatusCode.OK).json({ success: true, data: updatedTrialClass, message: "Trial class status updated successfully" });
    } catch (error: any) {
      logger.error("Error updating trial class status", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message: error.message || "Internal server error" });
    }
  };

  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const mentorId = req.user!.id;
      
      if (!id) throw new AppError("Trial class ID is required", HttpStatusCode.BAD_REQUEST);
      if (!rating && !comment) throw new AppError("Rating or comment is required", HttpStatusCode.BAD_REQUEST);
      if (rating && (rating < 1 || rating > 5)) throw new AppError("Rating must be between 1 and 5", HttpStatusCode.BAD_REQUEST);

      const feedback = { rating, comment };
      const updatedTrialClass = await this.trialClassService.submitMentorFeedback(id, mentorId, feedback);
      res.status(HttpStatusCode.OK).json({ success: true, data: updatedTrialClass, message: "Feedback submitted successfully" });
    } catch (error: any) {
      logger.error("Error submitting feedback", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message: error.message || "Internal server error" });
    }
  };
}