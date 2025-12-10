import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from "express";
import type { ICourseService } from "../interfaces/services/ICourseService";
import { HttpStatusCode } from "../constants/httpStatus";

@injectable()
export class CourseController {
  constructor(
    @inject(TYPES.ICourseService) private _courseService: ICourseService
  ) {}

  public getAvailableCourses = async (
    req: Request,
    res: Response,
    next: NextFunction
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
    } catch (error: any) {
      console.error("Error fetching available courses:", error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: error.message });
    }
  };

  public getCourseById = async (
    req: Request,
    res: Response,
    next: NextFunction
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
    } catch (error: any) {
      console.error("Error fetching course:", error);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error", error: error.message });
    }
  };
}

