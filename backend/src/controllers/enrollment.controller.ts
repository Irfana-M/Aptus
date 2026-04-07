import { injectable, inject } from "inversify";
import type { Request, Response, NextFunction } from "express";
import { TYPES } from "../types";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import type { IEnrollmentService } from "../interfaces/services/IEnrollmentService";
import { getPaginationParams } from "@/utils/pagination.util";
import { logger } from "@/utils/logger";
import { MESSAGES } from "../constants/messages.constants";
import { EnrollmentStatus } from "@/enums/enrollment.enum";
import { UserRole } from "@/enums/user.enum";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class EnrollmentController {
  constructor(
    @inject(TYPES.IEnrollmentService) private _enrollmentService: IEnrollmentService
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
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      const { courseId } = req.params;
      
      if (!courseId) {
        throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Course"), HttpStatusCode.BAD_REQUEST);
      }

      const enrollment = await this._enrollmentService.enrollInCourse(
        user.id, 
        courseId
      );

      res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: MESSAGES.COURSE.ENROLL_SUCCESS,
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
        throw new AppError(MESSAGES.AUTH.NOT_AUTHENTICATED, HttpStatusCode.UNAUTHORIZED);
      }

      const enrollments = await this._enrollmentService.getStudentEnrollments(
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
      const { status } = req.body as { status: EnrollmentStatus };
      
      if (!enrollmentId) {
        throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Enrollment"), HttpStatusCode.BAD_REQUEST);
      }

      const enrollment = await this._enrollmentService.updateEnrollmentStatus(
        enrollmentId,
        status
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.COURSE.ENROLLMENT_STATUS_UPDATED,
        data: enrollment,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  getAllEnrollments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      logger.info(`Fetching paginated enrollments for admin - Page: ${page}, Limit: ${limit}`);

      const result = await this._enrollmentService.getAllEnrollmentsPaginated({ page, limit });
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      next(error);
    }
  };
}

