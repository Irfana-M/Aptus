import type { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/types.js";
import type { ISubjectService } from "@/interfaces/services/ISubjectService.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { logger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";
import { MESSAGES } from "@/constants/messages.constants.js";

@injectable()
export class SubjectController {
  constructor(
    @inject(TYPES.ISubjectService)
    private _subjectService: ISubjectService
  ) {}

  async getAllSubjects(req: Request, res: Response): Promise<void> {
    try {
      const subjects = await this._subjectService.getAllSubjects();
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.COURSE.SUBJECTS_FETCH_SUCCESS,
        data: subjects,
      });
    } catch (error) {
      this.handleError(res, error, MESSAGES.COURSE.SUBJECTS_FETCH_FAILED);
    }
  }

  async getSubjectsByGrade(req: Request, res: Response): Promise<void> {
    try {
      const { grade, syllabus } = req.query;
      
      if (!grade || typeof grade !== 'string') {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COURSE.GRADE_REQUIRED,
        });
        return;
      }

      const subjects = await this._subjectService.getSubjectsByGrade(grade, syllabus as string);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.COURSE.SUBJECTS_FETCH_SUCCESS,
        data: subjects,
      });
    } catch (error) {
      this.handleError(res, error, MESSAGES.COURSE.SUBJECTS_FETCH_FAILED);
    }
  }

  async getSubjectsByGradeAndSyllabus(req: Request, res: Response): Promise<void> {
    try {
      const { grade, syllabus } = req.query;
      
      if (!grade || !syllabus) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COURSE.GRADE_SYLLABUS_REQUIRED,
        });
        return;
      }

      const gradeNumber = parseInt(grade as string);
      if (isNaN(gradeNumber)) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COURSE.INVALID_GRADE,
        });
        return;
      }

      const subjects = await this._subjectService.getSubjectsByGradeAndSyllabus(
        gradeNumber, 
        syllabus as string
      );
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.COURSE.SUBJECTS_FETCH_SUCCESS,
        data: subjects,
      });
    } catch (error) {
      this.handleError(res, error, MESSAGES.COURSE.SUBJECTS_FETCH_FAILED);
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