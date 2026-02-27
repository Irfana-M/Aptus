import { injectable, inject } from "inversify";
import type { Request, Response, NextFunction } from "express";
import { TYPES } from "../types";
import type { IStudentService } from "../interfaces/services/IStudentService";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import type { IMentorRequestService } from "../interfaces/services/IMentorRequestService";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: 'admin' | 'mentor' | 'student';
  };
}

@injectable()
export class StudentController {
  constructor(
    @inject(TYPES.IStudentService) private studentService: IStudentService,
    @inject(TYPES.IMentorRequestService) private mentorRequestService: IMentorRequestService 
  ) {}

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files?.profilePicture?.[0]) {
        req.body.profileImage = files.profilePicture[0];
      }
      
      if (files?.idProof?.[0]) {
        req.body.idProof = files.idProof[0];
      }

      const updatedProfile = await this.studentService.updateProfile(
        authReq.user.id,
        req.body
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getMyProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const profile = await this.studentService.getStudentProfileById(authReq.user.id);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Profile retrieved successfully",
        data: profile,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getStudentProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        throw new AppError("Student ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const profile = await this.studentService.getStudentProfileById(studentId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Student profile retrieved successfully",
        data: profile,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async updatePreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const { preferences } = req.body;
      const updatedProfile = await this.studentService.updatePreferences(
        authReq.user.id,
        preferences
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Preferences updated successfully",
        data: updatedProfile,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async updateBasicPreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const { subjectIds } = req.body;
      const updatedProfile = await this.studentService.updateBasicPreferences(
        authReq.user.id,
        subjectIds
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Basic preferences updated successfully",
        data: updatedProfile,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async requestMentor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const { subjectId, mentorId } = req.body;
      await this.studentService.requestMentor(authReq.user.id, subjectId, mentorId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Mentor request submitted successfully",
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getMyMentorRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const requests = await this.mentorRequestService.getRequestsByStudent(authReq.user.id);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: requests,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}
