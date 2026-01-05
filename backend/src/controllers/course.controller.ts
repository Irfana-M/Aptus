import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response } from "express";
import type { ICourseService } from "../interfaces/services/ICourseService";
import { HttpStatusCode } from "../constants/httpStatus";

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
      const { gradeId, subjectId, dayOfWeek, timeSlot, syllabus } = req.query;

      const filters = {
        gradeId,
        subjectId,
        dayOfWeek,
        timeSlot,
        syllabus
      };

      const courses = await this._courseService.getAvailableCourses(filters);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Available courses fetched successfully",
        data: courses,
      });
    } catch (error: unknown) {
      console.error("Error fetching available courses:", error);
      const err = error as Error;
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: err.message });
    }
  };

  public getCourseById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { id } = req.params;
      
      if (!id) {
          res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Course ID is required" });
          return;
      }

      const course = await this._courseService.getCourseById(id);

      if (!course) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: "Course not found" });
        return;
      }


      res.status(HttpStatusCode.OK).json({
        success: true,
        data: course,
      });
    } catch (error: unknown) {
      console.error("Error fetching course:", error);
      const err = error as Error;
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: err.message });
    }
  };

  public getStudentCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const studentId = req.user?.id;
      
      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: "Student not authenticated" });
        return;
      }

      const courses = await this._courseService.getCoursesByStudent(studentId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: courses,
      });
    } catch (error: unknown) {
      console.error("Error fetching student courses:", error);
      const err = error as Error;
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: err.message });
    }
  };

  public getMentorCourses = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const mentorId = req.user?.id;
      
      if (!mentorId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: "Mentor not authenticated" });
        return;
      }

      const courses = await this._courseService.getCoursesByMentor(mentorId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: courses,
      });
    } catch (error: unknown) {
      console.error("Error fetching mentor courses:", error);
      const err = error as Error;
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: err.message });
    }
  };
}

