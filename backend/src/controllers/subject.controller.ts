import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types";
import type { ISubjectService } from "@/interfaces/services/ISubjectService";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";

@injectable()
export class SubjectController {
  constructor(
    @inject(TYPES.ISubjectService)
    private subjectService: ISubjectService
  ) {}

  async getAllSubjects(req: Request, res: Response): Promise<void> {
    try {
      const subjects = await this.subjectService.getAllSubjects();
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Subjects fetched successfully",
        data: subjects,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch subjects");
    }
  }

  async getSubjectsByGrade(req: Request, res: Response): Promise<void> {
    try {
      const { grade } = req.query;
      
      if (!grade || typeof grade !== 'string') {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Grade query parameter is required",
        });
        return;
      }

      const subjects = await this.subjectService.getSubjectsByGrade(grade);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Subjects fetched successfully",
        data: subjects,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch subjects by grade");
    }
  }

  async getSubjectsByGradeAndSyllabus(req: Request, res: Response): Promise<void> {
    try {
      const { grade, syllabus } = req.query;
      
      if (!grade || !syllabus) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Grade and syllabus query parameters are required",
        });
        return;
      }

      const gradeNumber = parseInt(grade as string);
      if (isNaN(gradeNumber)) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Grade must be a valid number",
        });
        return;
      }

      const subjects = await this.subjectService.getSubjectsByGradeAndSyllabus(
        gradeNumber, 
        syllabus as string
      );
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Subjects fetched successfully",
        data: subjects,
      });
    } catch (error) {
      this.handleError(res, error, "Failed to fetch subjects by grade and syllabus");
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