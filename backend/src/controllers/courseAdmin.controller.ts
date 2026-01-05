import type { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import type { ICourseAdminService } from "../interfaces/services/ICourseAdminService"
import {TYPES} from "@/types";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import type { SubjectResponseDto } from "@/dto/student/subject.dto";
import { AppError } from "@/utils/AppError";

@injectable()
export class CourseAdminController {
  constructor(
    @inject(TYPES.ICourseAdminService)
    private courseService: ICourseAdminService,
    
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
             : (days as string).split(',').filter(d => d.trim().length > 0);
        }

        const mentors = await this.courseService.getAvailableMentorsForCourse(params);
        logger.info(`✅ [CourseAdminController] Found ${mentors.matches.length} matches and ${mentors.alternates.length} alternates for ${subjectId}`);
        res.json({ success: true, data: mentors });
      } catch (err) {
        next(err);
      }
  };

  createEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const course = await this.courseService.createEnrollment(req.body);
      res.status(HttpStatusCode.CREATED).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  };

  updateOneToOneCourse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      if (!courseId) throw new AppError("Course ID is required", HttpStatusCode.BAD_REQUEST);
      const course = await this.courseService.updateOneToOneCourse(courseId, req.body);
      res.status(HttpStatusCode.OK).json({ success: true, data: course });
    } catch (err) {
      next(err);
    }
  };

// In your CourseAdminController.ts → getAllOneToOneCourses
getAllOneToOneCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('ADMIN ROUTE HIT: /api/admin/courses/getAllCourses');
    console.log('Authenticated user:', req.user);

    // Check if pagination params are provided
    const page = req.query.page ? parseInt(req.query.page as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const search = req.query.search as string | undefined;
    const status = req.query.status as 'available' | 'booked' | 'ongoing' | 'completed' | 'cancelled' | '' | undefined;
    const gradeId = req.query.gradeId as string | undefined;

    // If any pagination/search params provided, use paginated method
    if (page !== undefined || limit !== undefined || search || status || gradeId) {
      logger.info("Admin: Fetching courses with pagination/filters", { page, limit, search, status, gradeId });
      
      const paginationParams: {
        page: number;
        limit: number;
        search?: string;
        status?: 'available' | 'booked' | 'ongoing' | 'completed' | 'cancelled' | '';
        gradeId?: string;
      } = {
        page: page || 1,
        limit: limit || 10,
      };
      
      if (search) paginationParams.search = search;
      if (status) paginationParams.status = status;
      if (gradeId) paginationParams.gradeId = gradeId;

      const result = await this.courseService.getAllCoursesPaginated(paginationParams);

      res.status(HttpStatusCode.OK).json(result);
      return;
    }

    // Fallback to original behavior for backward compatibility
    const courses = await this.courseService.getAllOneToOneCourses();

    console.log(`Found ${courses.length} courses in DB`);

    res.status(HttpStatusCode.OK).json({
      success: true,
      data: courses,
      message: "Courses fetched successfully",
      count: courses.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("ERROR in getAllOneToOneCourses:", err);
    console.error("Error stack:", err.stack);
    next(err);
  }
};
getAllGrades = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const grades = await this.courseService.getAllGrades();
    
    console.log(`Backend: Found ${grades.length} grades`);
    
    res.status(HttpStatusCode.OK).json({
      success: true,
      data: grades, // MUST be an array
      message: "Grades fetched successfully",
    });
  } catch (error) {
    console.error("Backend error fetching grades:", error);
    next(error);
  }
};
getSubjectsByGrade = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { gradeId } = req.query;
    
    logger.info(`AdminController: Fetching subjects for grade - ${gradeId}`);
    
    if (!gradeId || typeof gradeId !== 'string') {
      throw new AppError("Grade ID is required", HttpStatusCode.BAD_REQUEST);
    }
    
    const subjects = await this.courseService.getSubjectsByGrade(gradeId);
    
    // Transform to the expected DTO format
    const subjectDtos: SubjectResponseDto[] = subjects.map(subject => ({
      id: subject.id.toString(),
      subjectName: subject.subjectName,
      syllabus: subject.syllabus,
      grade: subject.grade,
    }));

    logger.info(`AdminController: Found ${subjects.length} subjects for grade ${gradeId}`);
    
    res.status(HttpStatusCode.OK).json({
      success: true,
      message: "Subjects fetched successfully",
      data: subjectDtos, // Ensure this is the array in "data" field
    });
  } catch (error) {
    logger.error(`AdminController: Error fetching subjects for grade ${req.query.gradeId}`, error);
    next(error);
  }
};
}