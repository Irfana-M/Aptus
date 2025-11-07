import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from "express";
import type { IAdminService } from "../interfaces/services/IAdminService";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { generateAccessToken, verifyRefreshToken } from "@/utils/jwt.util";
import { AppError } from "@/utils/AppError";
import type { IStudentService } from "@/interfaces/services/IStudentService";

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.IAdminService) private _adminService: IAdminService,
    @inject(TYPES.IStudentService) private _studentService: IStudentService
  ) {}

  addStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, email, phoneNumber } = req.body;

      logger.info(`Admin: Attempting to add student - ${email}`);

      
      if (!fullName || !email) {
        logger.warn(`Admin: Add student validation failed - missing name or email for ${email}`);
        res.status(HttpStatusCode.BAD_REQUEST).json({ 
          success: false, 
          message: 'Full name and email are required' 
        });
        return;
      }

      
      const existingStudent = await this._studentService.findStudentByEmail(email);
      if (existingStudent) {
        logger.warn(`Admin: Add student failed - student already exists: ${email}`);
        res.status(HttpStatusCode.CONFLICT).json({ 
          success: false, 
          message: 'Student with this email already exists' 
        });
        return;
      }

      
      const student = await this._studentService.createStudent({
        fullName,
        email,
        phoneNumber: phoneNumber || "",
        role: 'student',
        isVerified: true,
        isProfileComplete: false,
        approvalStatus: 'approved'
      });

      logger.info(`Admin: Student added successfully - ${email}`);

      res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: 'Student added successfully',
        data: student
      });

    } catch (error) {
      logger.error(`Admin: Add student error for ${req.body.email}:`, error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  };


  refreshAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      console.log("🔐 Backend Refresh - Cookies:", req.cookies);
      console.log(
        "🔐 Backend Refresh - Refresh token present:",
        !!refreshToken
      );
      if (!refreshToken) {
        throw new AppError(
          "No refresh token provided",
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const payload = verifyRefreshToken(refreshToken);
      console.log("🔐 Backend Refresh - Token payload:", payload);
      if (!payload || payload.role !== "admin") {
        throw new AppError(
          "Unauthorized refresh attempt",
          HttpStatusCode.FORBIDDEN
        );
      }

      const newAccessToken = generateAccessToken({
        id: payload.id,
        role: payload.role,
        email: payload.email,
      });

      logger.info(`Admin ${payload.id} refreshed access token`);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        accessToken: newAccessToken,
        admin: {
          _id: payload.id,
          email: payload.email,
          role: payload.role,
        },
        message: "Admin access token refreshed successfully",
      });
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError(
              "Admin token refresh failed",
              HttpStatusCode.INTERNAL_SERVER_ERROR
            )
      );
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const result = await this._adminService.login(email, password);

      const { accessToken, refreshToken, admin } = result;

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      logger.info(`Admin login successful: ${email}`);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        accessToken,
        admin,
        message: "Login successful",
      });
    } catch (error: any) {
      logger.error(`Admin login failed: ${req.body.email} - ${error.message}`);
      res.status(HttpStatusCode.UNAUTHORIZED).json({ message: error.message });
    }
  };

  getDashboardData = async (_req: Request, res: Response) => {
    try {
      logger.info("Fetching dashboard data");
      const data = await this._adminService.getDashboardData();
      logger.info("Dashboard data fetched successfully");
      res.status(HttpStatusCode.OK).json(data);
    } catch (error: any) {
      logger.error(`Error fetching dashboard data: ${error.message}`);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };

  getAllMentors = async (req: Request, res: Response) => {
    try {
      logger.info("Admin: Fetching all mentors");
      const mentors = await this._adminService.getAllMentors();
      logger.info(`Admin: Found ${mentors.length} mentors`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: mentors,
        count: mentors.length,
      });
    } catch (error: any) {
      logger.error(`Error fetching all mentors: ${error.message}`);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  };

  getAllStudents = async (req: Request, res: Response) => {
    try {
      logger.info("Admin: Fetching all students");
      const students = await this._adminService.getAllStudents();

      console.log("Students found", students);
      logger.info(`Admin: Found ${students.length} students`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: students,
        count: students.length,
      });
    } catch (error: any) {
      logger.error(`Error fetching all mentors: ${error.message}`);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  };

  getMentorProfile = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: "Mentor ID is required" });
    }
    try {
      logger.info(`Fetching mentor profile: ${mentorId}`);
      const mentor = await this._adminService.fetchMentorProfile(mentorId);
      if (!mentor) {
        logger.warn(`Mentor not found: ${mentorId}`);
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: "Mentor not found" });
      }
      logger.info(`Mentor profile fetched: ${mentorId}`);
      res.status(HttpStatusCode.OK).json(mentor);
    } catch (error: any) {
      logger.error(
        `Error fetching mentor profile ${mentorId}: ${error.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };

  approveMentor = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: "Mentor ID is required" });
    }
    const adminId = req.user?.id;
    if (!adminId) {
      logger.warn("Admin ID is missing in request");
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    try {
      logger.info(`Admin ${adminId} approving mentor: ${mentorId}`);
      const result = await this._adminService.updateMentorApprovalStatus(
        mentorId,
        "approved",
        adminId
      );
      logger.info(`Mentor ${mentorId} approved by admin ${adminId}`);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(
        `Error approving mentor ${mentorId} by admin ${adminId}: ${error.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };

  rejectMentor = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: "Mentor ID is required" });
    }
    const { reason } = req.body;
    const adminId = req.user?.id;
    if (!adminId) {
      logger.warn("Admin ID is missing in request");
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: "Unauthorized" });
    }
    try {
      logger.info(
        `Admin ${adminId} rejecting mentor: ${mentorId}, Reason: ${reason}`
      );
      const result = await this._adminService.updateMentorApprovalStatus(
        mentorId,
        "rejected",
        adminId,
        reason
      );
      logger.info(`Mentor ${mentorId} rejected by admin ${adminId}`);
      res.status(HttpStatusCode.OK).json(result);
    } catch (error: any) {
      logger.error(
        `Error rejecting mentor ${mentorId} by admin ${adminId}: ${error.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: error.message });
    }
  };
}
