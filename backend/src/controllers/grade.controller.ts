import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types.js";
import type { IGradeService } from "@/interfaces/services/IGradeService.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { logger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";
import { MESSAGES } from "@/constants/messages.constants.js";

@injectable()
export class GradeController {
  constructor(
    @inject(TYPES.IGradeService)
    private _gradeService: IGradeService
  ) { }

  async getAllGrades(req: Request, res: Response): Promise<void> {
    try {
      const grades = await this._gradeService.getAllGrades();

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.GRADE.FETCH_SUCCESS,
        data: grades,
      });
    } catch (error) {
      this._handleError(res, error, MESSAGES.GRADE.FETCH_FAILED);
    }
  }

  async getGradesBySyllabus(req: Request, res: Response): Promise<void> {
    try {
      const { syllabus } = req.query;

      if (!syllabus || typeof syllabus !== "string") {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.REQUIRED_PARAMETER("Syllabus"),
        });
        return;
      }

      const grades = await this._gradeService.getGradesBySyllabus(syllabus);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.GRADE.FETCH_SUCCESS,
        data: grades,
      });
    } catch (error) {
      this._handleError(res, error, MESSAGES.GRADE.FETCH_FAILED);
    }
  }

  private _handleError(
    res: Response,
    error: unknown,
    defaultMessage: string
  ): void {
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
}
