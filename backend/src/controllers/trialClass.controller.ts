import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import type { ITrialClassService } from "@/interfaces/services/ITrialClassService";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";

@injectable()
export class TrialClassController {
  constructor(
    @inject(TYPES.ITrialClassService)
    private trialService: ITrialClassService
  ) {}

  async createTrialRequest(req: Request, res: Response): Promise<void> {
    try {
      const { subject, preferredDate, preferredTime } = req.body;
      const studentId = req.user?.id;

      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student not logged in",
        });
        return;
      }

      const trialClass = await this.trialService.requestTrialClass(
        { subject, preferredDate, preferredTime },
        studentId
      );

      res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Trial class requested successfully",
        data: trialClass, 
      });
    } catch (error) {
      this.handleError(res, error, "Failed to create trial class request");
    }
  }

  async getStudentTrialClasses(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      
      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student not logged in",
        });
        return;
      }

      const trialClasses = await this.trialService.getStudentTrialClasses(studentId);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Trial classes fetched successfully",
        data: trialClasses,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch trial classes");
    }
  }

  async getTrialClassById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const studentId = req.user?.id;

      if (!id) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Trial class ID is required",
        });
        return;
      }

      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student not logged in",
        });
        return;
      }

      const trialClass = await this.trialService.getTrialClassById(id, studentId);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Trial class fetched successfully",
        data: trialClass,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch trial class");
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
    const studentId = req.user?.id;

    if (!studentId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        message: "Unauthorized: Student not logged in",
      });
      return;
    }

    if (!id) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Trial class ID is required",
      });
      return;
    }

    const trialClass = await this.trialService.updateTrialClass(
      id,
      studentId,
      { subject, preferredDate, preferredTime, notes }
    );

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: "Trial class updated successfully",
      data: trialClass,
    });
  } catch (error) {
    this.handleError(res, error, "Failed to update trial class");
  }
  }

  async submitFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const studentId = req.user?.id;

      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Unauthorized: Student not logged in",
        });
        return;
      }

      if (!id) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Trial class ID is required",
        });
        return;
      }

      if (rating === undefined || rating < 1 || rating > 5) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Valid rating (1-5) is required",
        });
        return;
      }

      const trialClass = await this.trialService.submitFeedback(
        id,
        studentId,
        { rating, comment }
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Feedback submitted successfully",
        data: trialClass,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to submit feedback");
    }
  }
}