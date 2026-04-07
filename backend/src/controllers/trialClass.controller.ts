import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import type { ITrialClassService } from "@/interfaces/services/ITrialClassService";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { MESSAGES } from "@/constants/messages.constants";
import { getPaginationParams, formatStandardizedPaginatedResult } from "@/utils/pagination.util";
import { UserRole } from "@/enums/user.enum";
import { TrialClassStatus } from "@/enums/trialClass.enum";

interface ExtendedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class TrialClassController {
  constructor(
    @inject(TYPES.ITrialClassService)
    private _trialService: ITrialClassService
  ) {}

  async createTrialRequest(req: Request, res: Response): Promise<void> {
    try {
      const { subject, preferredDate, preferredTime } = req.body;
      const studentId = (req as ExtendedRequest).user?.id;

      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.UNAUTHORIZED_STUDENT,
        });
        return;
      }

      logger.info(`🚀 [API] Creating trial request for student ${studentId}, Subject: ${subject}`);
      const trialClass = await this._trialService.requestTrialClass(
        { subject, preferredDate, preferredTime },
        studentId
      );
      logger.info(`✅ [API] Trial request created successfully for student ${studentId}`);

      res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: MESSAGES.TRIAL_CLASS.REQUEST_SUCCESS,
        data: trialClass, 
      });
    } catch (error: unknown) {
      this.handleError(res, error, MESSAGES.TRIAL_CLASS.CREATE_FAILED);
    }
  }

  async getStudentTrialClasses(req: Request, res: Response): Promise<void> {
    try {
      const studentId = (req as ExtendedRequest).user?.id;
      
      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.UNAUTHORIZED_STUDENT,
        });
        return;
      }

      const { page, limit } = getPaginationParams(req.query);

      logger.info(`📡 [API] Fetching trial classes for student ${studentId}`);
      const { items, total } = await this._trialService.getStudentTrialClasses(studentId, page, limit);
      logger.info(`✅ [API] Returning ${items.length} trial classes for student ${studentId}`);

      const result = formatStandardizedPaginatedResult(
        items,
        total,
        { page, limit },
        MESSAGES.TRIAL_CLASS.FETCH_SUCCESS
      );
      
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      this.handleError(res, error, MESSAGES.TRIAL_CLASS.FETCH_FAILED);
    }
  }

  async getTrialClassById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = (req as ExtendedRequest).user?.id;

      if (!id) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.ID_REQUIRED,
        });
        return;
      }

      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.UNAUTHORIZED_STUDENT,
        });
        return;
      }

      const trialClass = await this._trialService.getTrialClassById(id, studentId);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.TRIAL_CLASS.FETCH_SUCCESS,
        data: trialClass,
      });
    } catch (error: unknown) {
      this.handleError(res, error, MESSAGES.TRIAL_CLASS.FETCH_FAILED);
    }
  }

  // New endpoint: Get available time slots for trial classes
  async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { subject, date } = req.query;

      if (!subject || !date) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.SUBJECT_DATE_REQUIRED,
        });
        return;
      }

      logger.info(`📡 [API] Fetching available trial slots for Subject: ${subject}, Date: ${date}`);
      const availableSlots = await this._trialService.getAvailableSlots(
        subject as string,
        date as string
      );
      logger.info(`✅ [API] Returning ${(availableSlots as any).slots?.length || 0} slots (Availability: ${availableSlots.hasAvailability})`);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: availableSlots.hasAvailability 
          ? MESSAGES.ADMIN.FETCH_SUCCESS
          : MESSAGES.TRIAL_CLASS.NO_MENTORS_AVAILABLE,
        data: availableSlots,
      });
    } catch (error: unknown) {
      this.handleError(res, error, MESSAGES.TRIAL_CLASS.FETCH_FAILED);
    }
  }

  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    logger.error(defaultMessage, error);
    
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: defaultMessage,
      });
    }
  }

  
async updateTrialClass(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { subject, preferredDate, preferredTime, notes } = req.body;
    const studentId = (req as ExtendedRequest).user?.id;

    if (!studentId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.TRIAL_CLASS.UNAUTHORIZED_STUDENT,
      });
      return;
    }

    if (!id) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.TRIAL_CLASS.ID_REQUIRED,
      });
      return;
    }

    const trialClass = await this._trialService.updateTrialClass(
      id,
      studentId,
      { subject, preferredDate, preferredTime, notes }
    );

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: MESSAGES.TRIAL_CLASS.UPDATE_SUCCESS,
      data: trialClass,
    });
  } catch (error: unknown) {
    this.handleError(res, error, MESSAGES.TRIAL_CLASS.UPDATE_FAILED);
  }
  }

  async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const studentId = (req as ExtendedRequest).user?.id;

      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.UNAUTHORIZED_STUDENT,
        });
        return;
      }

      if (!id) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.ID_REQUIRED,
        });
        return;
      }

      if (rating === undefined || rating < 1 || rating > 5) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.RATING_REQUIRED,
        });
        return;
      }

      const trialClass = await this._trialService.submitFeedback(
        id,
        studentId,
        { rating, comment }
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.TRIAL_CLASS.FEEDBACK_SUCCESS,
        data: trialClass,
      });
    } catch (error: unknown) {
      this.handleError(res, error, MESSAGES.TRIAL_CLASS.FEEDBACK_FAILED);
    }
  }

  async completeTrialClass(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as ExtendedRequest).user?.id;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.UNAUTHORIZED_USER,
        });
        return;
      }

      if (!id) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.TRIAL_CLASS.ID_REQUIRED,
        });
        return;
      }

      
      await this._trialService.getTrialClassById(id, userId);

      const trialClass = await this._trialService.updateTrialClassStatus(id, TrialClassStatus.COMPLETED);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.TRIAL_CLASS.MARKED_COMPLETED,
        data: trialClass,
      });
    } catch (error: unknown) {
      this.handleError(res, error, MESSAGES.TRIAL_CLASS.UPDATE_FAILED);
    }
  }
}