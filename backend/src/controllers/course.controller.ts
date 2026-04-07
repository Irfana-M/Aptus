import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response } from "express";
import type { ICourseService } from "../interfaces/services/ICourseService";
import { HttpStatusCode } from "../constants/httpStatus";
import { getPaginationParams } from "@/utils/pagination.util";
import type { CoursePaginationParams } from "@/dtos/shared/paginationTypes";
import { MESSAGES } from "@/constants/messages.constants";
import { CourseStatus } from "@/enums/course.enum";
import { UserRole } from "@/enums/user.enum";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class CourseController {
  constructor(
    @inject(TYPES.ICourseService) private _courseService: ICourseService
  ) {}

  public getAvailableCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const { gradeId, subjectId, dayOfWeek, timeSlot, syllabus } = req.query;

      const params: CoursePaginationParams = {
        page,
        limit,
      };
      if (gradeId) params.gradeId = gradeId as string;
      if (subjectId) params.subjectId = subjectId as string;
      if (dayOfWeek) params.dayOfWeek = parseInt(dayOfWeek as string);
      if (timeSlot) params.timeSlot = timeSlot as string;
      if (syllabus) params.syllabus = syllabus as string;

      const result = await this._courseService.getAvailableCourses(params);

      res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      console.error("Error fetching available courses:", error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: MESSAGES.COMMON.INTERNAL_SERVER_ERROR });
    }
  };

  public getCourseById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
          res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.COMMON.ID_REQUIRED("Course") });
          return;
      }

      const course = await this._courseService.getCourseById(id);

      if (!course) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: MESSAGES.COURSE.NOT_FOUND });
        return;
      }


      res.status(HttpStatusCode.OK).json({
        success: true,
        data: course,
      });
    } catch (error: unknown) {
      console.error("Error fetching course:", error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: MESSAGES.COMMON.INTERNAL_SERVER_ERROR });
    }
  };

  public getStudentCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const studentId = authReq.user?.id;
      
      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: MESSAGES.COMMON.UNAUTHORIZED });
        return;
      }

      const courses = await this._courseService.getCoursesByStudent(studentId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: courses,
      });
    } catch (error: unknown) {
      console.error("Error fetching student courses:", error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: MESSAGES.COMMON.INTERNAL_SERVER_ERROR });
    }
  };

  public getMentorCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const mentorId = authReq.user?.id;
      
      if (!mentorId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: MESSAGES.COMMON.UNAUTHORIZED });
        return;
      }

      const courses = await this._courseService.getCoursesByMentor(mentorId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: courses,
      });
    } catch (error: unknown) {
      console.error("Error fetching mentor courses:", error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: MESSAGES.COMMON.INTERNAL_SERVER_ERROR });
    }
  };
}

