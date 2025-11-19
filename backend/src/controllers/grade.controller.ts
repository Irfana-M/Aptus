import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types";
import type { IGradeService } from "@/interfaces/services/IGradeService";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";

@injectable()
export class GradeController {
  constructor(
    @inject(TYPES.IGradeService)
    private gradeService: IGradeService
  ) {}

  async getAllGrades(req: Request, res: Response): Promise<void> {
    try {
      const grades = await this.gradeService.getAllGrades();
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Grades fetched successfully",
        data: grades,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch grades");
    }
  }

  async getGradesBySyllabus(req: Request, res: Response): Promise<void> {
    try {
      const { syllabus } = req.query;
      
      if (!syllabus || typeof syllabus !== 'string') {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Syllabus query parameter is required",
        });
        return;
      }

      const grades = await this.gradeService.getGradesBySyllabus(syllabus);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Grades fetched successfully",
        data: grades,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch grades by syllabus");
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
}