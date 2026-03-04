import { injectable, inject } from "inversify";
import { TYPES } from "@/types.js";
import type { Request, Response } from "express";
import type { ITrialClassService } from "@/interfaces/services/ITrialClassService.js";
import { logger } from "@/utils/logger.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { AppError } from "@/utils/AppError.js";
import { MESSAGES } from "@/constants/messages.constants.js";

@injectable()
export class MentorTrialClassController {
  constructor(@inject(TYPES.ITrialClassService) private _trialClassService: ITrialClassService) {}

  getMentorTrialClasses = async (req: Request, res: Response): Promise<void> => {
    try {
      const mentorId = req.user!.id;
      const trialClasses = await this._trialClassService.getMentorTrialClasses(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: trialClasses, message: MESSAGES.TRIAL_CLASS.RETRIEVE_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error getting mentor trial classes", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  getTodayTrialClasses = async (req: Request, res: Response): Promise<void> => {
    try {
      const mentorId = req.user!.id;
      const todayTrialClasses = await this._trialClassService.getTodayTrialClasses(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: todayTrialClasses, message: MESSAGES.TRIAL_CLASS.TODAY_RETRIEVE_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error getting today's trial classes", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const mentorId = req.user!.id;
      const stats = await this._trialClassService.getTrialClassStats(mentorId);
      res.status(HttpStatusCode.OK).json({ success: true, data: stats, message: MESSAGES.TRIAL_CLASS.STATS_RETRIEVE_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error getting trial class stats", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      if (!id) throw new AppError(MESSAGES.TRIAL_CLASS.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
      if (!status) throw new AppError(MESSAGES.TRIAL_CLASS.STATUS_REQUIRED, HttpStatusCode.BAD_REQUEST);

      const updatedTrialClass = await this._trialClassService.updateTrialClassStatus(id, status, reason);
      res.status(HttpStatusCode.OK).json({ success: true, data: updatedTrialClass, message: MESSAGES.TRIAL_CLASS.UPDATE_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error updating trial class status", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  submitFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const mentorId = req.user!.id;
      
      if (!id) throw new AppError(MESSAGES.TRIAL_CLASS.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
      if (!rating && !comment) throw new AppError(MESSAGES.TRIAL_CLASS.FEEDBACK_MISSING, HttpStatusCode.BAD_REQUEST);
      if (rating && (rating < 1 || rating > 5)) throw new AppError(MESSAGES.TRIAL_CLASS.INVALID_RATING_RANGE, HttpStatusCode.BAD_REQUEST);

      const feedback = { rating, comment };
      const updatedTrialClass = await this._trialClassService.submitMentorFeedback(id, mentorId, feedback);
      res.status(HttpStatusCode.OK).json({ success: true, data: updatedTrialClass, message: MESSAGES.TRIAL_CLASS.FEEDBACK_SUCCESS });
    } catch (error: unknown) {
      logger.error("Error submitting feedback", error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };
}