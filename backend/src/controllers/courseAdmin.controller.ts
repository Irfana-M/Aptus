import type { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import type { ICourseAdminService } from "../interfaces/services/ICourseAdminService"
import {TYPES} from "@/types";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import type { CoursePaginationParams } from "@/dtos/shared/paginationTypes";
import type { SubjectResponseDto } from "@/dtos/student/subject.dto";
import { AppError } from "@/utils/AppError";
import { getPaginationParams } from "@/utils/pagination.util";
import { MESSAGES } from "@/constants/messages.constants";
import { CourseStatus } from "@/enums/course.enum";

@injectable()
export class CourseAdminController {
  constructor(
    @inject(TYPES.ICourseAdminService)
    private _courseService: ICourseAdminService,
    
  ) {}

  getAvailableMentors = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { gradeId, subjectId, dayOfWeek, timeSlot, days, excludeCourseId } = req.query;
        logger.info(`🔍 [CourseAdminController] Fetching available mentors:`, { gradeId, subjectId, days, timeSlot });
        
        const params: { 
          gradeId: string; 
          subjectId: string; 
          dayOfWeek?: number; 
          timeSlot?: string; 
          days?: string[]; 
          excludeCourseId?: string;
        } = {
          gradeId: (Array.isArray(gradeId) ? (gradeId[0] as string) : (gradeId as string)),
          subjectId: (Array.isArray(subjectId) ? (subjectId[0] as string) : (subjectId as string)),
          timeSlot: timeSlot as string,
          excludeCourseId: excludeCourseId as string,
        };
        
        if (dayOfWeek) {
           params.dayOfWeek = Array.isArray(dayOfWeek) ? parseInt(dayOfWeek[0] as string, 10) : parseInt(dayOfWeek as string, 10);
        }
        
        if (days) {
           params.days = Array.isArray(days) 
             ? (days as string[]) 
             : (days as string).split(',').filter(day => day.trim().length > 0);
        }

        const mentors = await this._courseService.getAvailableMentorsForCourse(params);
        logger.info(`✅ [CourseAdminController] Found ${mentors.matches.length} matches and ${mentors.alternates.length} alternates for ${subjectId}`);
        res.json({ success: true, data: mentors });
      } catch (error) {
        next(error);
      }
  };

  createEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this._courseService.createEnrollment(req.body);
      res.status(HttpStatusCode.CREATED).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  };

  updateOneToOneCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      if (!courseId) throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Course"), HttpStatusCode.BAD_REQUEST);
      const course = await this._courseService.updateOneToOneCourse(courseId, req.body);
      res.status(HttpStatusCode.OK).json({ success: true, data: course });
    } catch (error) {
      next(error);
    }
  };

getAllOneToOneCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const search = req.query.search as string | undefined;
    const status = req.query.status as CourseStatus | '' | undefined;
    const gradeId = req.query.gradeId as string | undefined;

    logger.info("Admin: Fetching courses with pagination/filters", { page, limit, search, status, gradeId });
    
    const paginationParams: CoursePaginationParams = {
      page,
      limit,
      search,
      gradeId,
    };

    if (status) {
      paginationParams.status = status;
    }

    const result = await this._courseService.getAllCoursesPaginated(paginationParams);
    res.status(HttpStatusCode.OK).json(result);
  } catch (error: unknown) {
    next(error);
  }
};

getAllGrades = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const grades = await this._courseService.getAllGrades();
    res.status(HttpStatusCode.OK).json({
      success: true,
      data: grades,
      message: MESSAGES.COURSE.GRADES_FETCH_SUCCESS,
    });
  } catch (error) {
    next(error);
  }
};

getSubjectsByGrade = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gradeId } = req.query;
    if (!gradeId || typeof gradeId !== 'string') {
      throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Grade"), HttpStatusCode.BAD_REQUEST);
    }
    const subjects = await this._courseService.getSubjectsByGrade(gradeId);
    const subjectDtos: SubjectResponseDto[] = subjects.map(subject => ({
      id: subject.id.toString(),
      subjectName: subject.subjectName,
      syllabus: subject.syllabus,
      grade: subject.grade,
    }));
    res.status(HttpStatusCode.OK).json({
      success: true,
      message: MESSAGES.COURSE.SUBJECTS_FETCH_SUCCESS,
      data: subjectDtos,
    });
  } catch (error) {
    next(error);
  }
};

  enrollStudentToCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const { studentId } = req.body;
      if (!courseId || !studentId) throw new AppError(MESSAGES.COMMON.REQUIRED_FIELDS(["Course ID", "Student ID"]), HttpStatusCode.BAD_REQUEST);
      const result = await this._courseService.enrollStudentToCourse(courseId, studentId);
      res.status(HttpStatusCode.OK).json({ success: true, data: result, message: MESSAGES.COURSE.ENROLL_SUCCESS });
    } catch (error) {
      next(error);
    }
  };

  unenrollStudentFromCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, studentId } = req.params;
      if (!courseId || !studentId) throw new AppError(MESSAGES.COMMON.REQUIRED_FIELDS(["Course ID", "Student ID"]), HttpStatusCode.BAD_REQUEST);
      const result = await this._courseService.unenrollStudentFromCourse(courseId, studentId);
      res.status(HttpStatusCode.OK).json({ success: true, data: result, message: MESSAGES.COURSE.UNENROLL_SUCCESS });
    } catch (error) {
      next(error);
    }
  };
}