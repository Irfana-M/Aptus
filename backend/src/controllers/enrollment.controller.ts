import { injectable, inject } from "inversify";
import type { Request, Response, NextFunction } from "express";
import { TYPES } from "../types";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import type { IEnrollmentService } from "../interfaces/services/IEnrollmentService";

@injectable()
export class EnrollmentController {
  constructor(
    @inject(TYPES.IEnrollmentService) private enrollmentService: IEnrollmentService
  ) {}

  enrollInCourse = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Inversify auth middleware usually populates req.user
      // But let's keep the check if middleware isn't trusted implicitly
      const user = req.user;
      if (!user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const { courseId } = req.params;
      
      if (!courseId) {
        throw new AppError("Course ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const enrollment = await this.enrollmentService.enrollInCourse(
        user.id, 
        courseId
      );

      res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Successfully enrolled in course",
        data: enrollment,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  getMyEnrollments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      if (!user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const enrollments = await this.enrollmentService.getStudentEnrollments(
        user.id,
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: enrollments,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  updateEnrollmentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { enrollmentId } = req.params;
      const { status } = req.body;
      
      if (!enrollmentId) {
        throw new AppError("Enrollment ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const enrollment = await this.enrollmentService.updateEnrollmentStatus(
        enrollmentId,
        status
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Enrollment status updated",
        data: enrollment,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}

