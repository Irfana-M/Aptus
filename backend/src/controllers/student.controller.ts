import { injectable, inject } from "inversify";
import type { Request, Response, NextFunction } from "express";
import { TYPES } from "../types";
import type { IStudentService } from "../interfaces/services/IStudentService";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import type { IWalletService } from "../interfaces/services/IWalletService";
import type { IMentorRequestService } from "../interfaces/services/IMentorRequestService";

@injectable()
export class StudentController {
  constructor(
    @inject(TYPES.IStudentService) private studentService: IStudentService,
    @inject(TYPES.IWalletService) private walletService: IWalletService,
    @inject(TYPES.IMentorRequestService) private mentorRequestService: IMentorRequestService 
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

  
  async getMyProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const profile = await this.studentService.getStudentProfileById(req.user.id);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Profile retrieved successfully",
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWallet(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED);
      }

      const wallet = await this.walletService.getWallet(studentId) as { balance?: number } | null;
      res.status(HttpStatusCode.OK).json({
        success: true,
        balance: wallet?.balance || 0,
        wallet
      });
    } catch (error) {
      logger.error("Error fetching wallet", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch wallet",
      });
    }
  }

  async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.id;
      if (!studentId) {
        throw new AppError("Unauthorized", HttpStatusCode.UNAUTHORIZED);
      }

      const transactions = await this.walletService.getTransactions(studentId);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      logger.error("Error fetching transactions", error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch transactions",
      });
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

  async updatePreferences(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const { preferences } = req.body;
      const updatedProfile = await this.studentService.updatePreferences(
        req.user.id,
        preferences
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Preferences updated successfully",
        data: updatedProfile,
      });
    } catch (error) {
      next(error);
    }
  }

  async requestMentor(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const { subjectId, mentorId } = req.body;
      await this.studentService.requestMentor(req.user.id, subjectId, mentorId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Mentor request submitted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyMentorRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("User not authenticated", HttpStatusCode.UNAUTHORIZED);
      }

      const requests = await this.mentorRequestService.getRequestsByStudent(req.user.id);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }
}
