import { injectable, inject } from "inversify";
import type { Request, Response, NextFunction } from "express";
import { TYPES } from "../types";
import type { IStudentService } from "../interfaces/services/IStudentService";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";

@injectable()
export class StudentController {
  constructor(
    @inject(TYPES.IStudentService) private studentService: IStudentService
  ) {}

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      // Handle file uploads from multer
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files?.profilePicture?.[0]) {
        req.body.profileImage = files.profilePicture[0];
      }
      
      if (files?.idProof?.[0]) {
        req.body.idProof = files.idProof[0];
      }

      const updatedProfile = await this.studentService.updateProfile(
        req.user.id,
        req.body
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
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
    } catch (error) {
      next(error);
    }
  }
}
