import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from "express";
import type { IAdminService } from "../interfaces/services/IAdminService";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { generateAccessToken, verifyRefreshToken } from "@/utils/jwt.util";
import { AppError } from "@/utils/AppError";
import { config } from "../config/app.config";
import { getPaginationParams } from "@/utils/pagination.util";
import type { MentorPaginationParams, StudentPaginationParams } from "@/dtos/shared/paginationTypes";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'mentor' | 'student';
  };
}

@injectable()
export class AdminController {
  
  constructor(
    @inject(TYPES.IAdminService) private _adminService: IAdminService,
  ) {}

    addStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fullName, email, phoneNumber } = req.body;

      logger.info(`Admin: Adding new student - ${email}`);

      if (!fullName || !email) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: "Full name and email are required",
        });
        return;
      }

      const result = await this._adminService.addStudent({
        fullName,
        email,
        phoneNumber,
      });

      logger.info(`Admin: Student added successfully - ${email}`);

      res.status(HttpStatusCode.CREATED).json({
        success: true,
        message: "Student added successfully",
        data: result,
      });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Admin: Add student error for ${req.body.email}:`, err);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  };

  refreshAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = req.cookies?.adminRefreshToken;
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
    } catch (error: unknown) {
      // Clear cookie immediately on any refresh failure to prevent infinite loops
      res.clearCookie("adminRefreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

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

      res.cookie("adminRefreshToken", refreshToken, config.cookie.refreshToken);
      logger.info(`Admin login successful: ${email}`);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        accessToken,
        admin,
        message: "Login successful",
      });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Admin login failed: ${req.body.email} - ${err.message}`);
      res.status(HttpStatusCode.UNAUTHORIZED).json({ message: err.message });
    }
  };

  getDashboardData = async (_req: Request, res: Response) => {
    try {
      logger.info("Fetching dashboard data");
      const data = await this._adminService.getDashboardData();
      logger.info("Dashboard data fetched successfully");
      res.status(HttpStatusCode.OK).json(data);
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Error fetching dashboard data: ${err.message}`);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };

  getAllMentors = async (req: Request, res: Response) => {
    try {
      const { page, limit, ..._otherParams } = getPaginationParams(req.query);
      const search = req.query.search as string | undefined;
      const status = req.query.status as 'pending' | 'approved' | 'rejected' | '' | undefined;
      const subject = req.query.subject as string | undefined;

      logger.info("Admin: Fetching mentors with pagination/filters", { page, limit, search, status, subject });
      
      const paginationParams: MentorPaginationParams = {
        page,
        limit,
      };
      if (search) paginationParams.search = search;
      if (status) paginationParams.status = status;
      if (subject) paginationParams.subject = subject;

      const result = await this._adminService.getAllMentorsPaginated(paginationParams);
      return res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Error fetching mentors: ${err.message}`);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message,
      });
    }
  };

  getAllStudents = async (req: Request, res: Response) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const search = req.query.search as string | undefined;
      const status = req.query.status as 'active' | 'blocked' | '' | undefined;
      const verification = req.query.verification as 'verified' | 'pending' | '' | undefined;

      logger.info("Admin: Fetching students with pagination/filters", { page, limit, search, status, verification });
      
      const paginationParams: StudentPaginationParams = {
        page,
        limit,
      };
      if (search) paginationParams.search = search;
      if (status) paginationParams.status = status;
      if (verification) paginationParams.verification = verification;

      const result = await this._adminService.getAllStudentsPaginated(paginationParams);
      return res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Error fetching students: ${err.message}`);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message,
      });
    }
  };

  getMentorProfile = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    logger.info(`👤 [AdminController] Attempting to fetch mentor profile for ID: ${mentorId}`);
    
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
      logger.info(`✅ [AdminController] Successfully fetched mentor profile for: ${mentorId}`);
      res.status(HttpStatusCode.OK).json(mentor);
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(
        `Error fetching mentor profile ${mentorId}: ${err.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
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
    const authReq = req as AuthenticatedRequest;
    const adminId = authReq.user?.id;
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
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(
        `Error approving mentor ${mentorId} by admin ${adminId}: ${err.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
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
    const adminId = (req as AuthenticatedRequest).user?.id;
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
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(
        `Error rejecting mentor ${mentorId} by admin ${adminId}: ${err.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: err.message });
    }
  };


  blockMentor = async (req: Request, res: Response): Promise<void> => {
    const mentorId = req.params.mentorId;
    
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Mentor ID is required",
      });
      return;
    }

    try {
      logger.info(`Blocking mentor: ${mentorId}`);
      const result = await this._adminService.blockMentor(mentorId);
      
      logger.info(`Mentor blocked successfully: ${mentorId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
        message: "Mentor blocked successfully",
      });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Error blocking mentor ${mentorId}: ${err.message}`);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  };


unblockMentor = async (req: Request, res: Response): Promise<void> => {
    const mentorId = req.params.mentorId;
    
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Mentor ID is required",
      });
      return;
    }

    try {
      logger.info(`Unblocking mentor: ${mentorId}`);
      const result = await this._adminService.unblockMentor(mentorId);
      
      logger.info(`Mentor unblocked successfully: ${mentorId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
        message: "Mentor unblocked successfully",
      });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Error unblocking mentor ${mentorId}: ${err.message}`);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  };


  addMentor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, phoneNumber, location, bio } = req.body;

    logger.info(`Admin: Adding new mentor - ${email}`);

    if (!fullName || !email) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Full name and email are required",
      });
      return;
    }

    const result = await this._adminService.addMentor({
      fullName,
      email,
      phoneNumber,
      location,
      bio,
    });

    logger.info(`Admin: Mentor added successfully - ${email}`);

    res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: "Mentor added successfully",
      data: result,
    });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Admin: Add mentor error for ${req.body.email}:`, err);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
};


updateMentor = async (req: Request, res: Response): Promise<void> => {
  try {
    const mentorId = req.params.mentorId;
    const updateData = req.body;

    logger.info(`Admin: Updating mentor - ${mentorId}`);

    if (!mentorId) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Mentor ID is required",
      });
      return;
    }

    const result = await this._adminService.updateMentor(mentorId, updateData);

    logger.info(`Admin: Mentor updated successfully - ${mentorId}`);

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: "Mentor updated successfully",
      data: result,
    });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Admin: Update mentor error for ${req.params.mentorId}:`, err);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
};

updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = req.params.studentId;
    const updateData = req.body;

    logger.info(`Admin: Updating student - ${studentId}`);

    if (!studentId) {
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
      return;
    }

    const result = await this._adminService.updateStudent(studentId, updateData);

    logger.info(`Admin: Student updated successfully - ${studentId}`);

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: "Student updated successfully",
      data: result,
    });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Admin: Update student error for ${req.params.studentId}:`, err);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
};


   blockStudent = async (req: Request, res: Response): Promise<void> => {
    const studentId = req.params.studentId;
    
    if (!studentId) {
      logger.warn("Student ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
      return;
    }

    try {
      logger.info(`Blocking student: ${studentId}`);
      const result = await this._adminService.blockStudent(studentId);
      
      logger.info(`Student blocked successfully: ${studentId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
        message: "Student blocked successfully",
      });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Error blocking student ${studentId}: ${err.message}`);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  };

  unblockStudent = async (req: Request, res: Response): Promise<void> => {
    const studentId = req.params.studentId;
    
    if (!studentId) {
      logger.warn("Student ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: "Student ID is required",
      });
      return;
    }

    try {
      logger.info(`Unblocking student: ${studentId}`);
      const result = await this._adminService.unblockStudent(studentId);
      
      logger.info(`Student unblocked successfully: ${studentId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
        message: "Student unblocked successfully",
      });
    } catch (error: unknown) {
      const err = error as AppError;
      logger.error(`Error unblocking student ${studentId}: ${err.message}`);
      const statusCode = err.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: err.message,
      });
    }
  };


   getStudentsWithTrialStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      logger.info(`AdminController: Fetching students with trial stats - Page: ${page}, Limit: ${limit}`);

      const result = await this._adminService.getStudentsWithTrialStats(page, limit);

      logger.info(`AdminController: Successfully fetched students with trial stats`);

      res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      logger.error("AdminController: Error fetching students with trial stats", error);
      next(error);
    }
  };


  // In your AdminController - add detailed logging
getStudentTrialClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId } = req.params;
    const { status } = req.query;


    logger.info(`AdminController: Fetching trial classes for student - ${studentId}`, { status });

    if (!studentId) {
      throw new AppError("Student ID is required", HttpStatusCode.BAD_REQUEST);
    }

    // Add try-catch around the service call
    const trialClasses = await this._adminService.getStudentTrialClasses(studentId, status as string);

    logger.info(`AdminController: Found ${trialClasses.length} trial classes for student ${studentId}`);

    res.status(HttpStatusCode.OK).json({
      success: true,
      data: trialClasses,
      count: trialClasses.length,
      message: "Student trial classes fetched successfully",
    });
    
    console.log('🔍 [DEBUG] AdminController.getStudentTrialClasses - END');
  } catch (error) {
    console.error('🔍 [DEBUG] Controller error:', error);
    logger.error(`AdminController: Error fetching trial classes for student ${req.params.studentId}`, error);
    next(error);
  }
};



  getAllTrialClasses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const status = req.query.status as string | undefined;

      logger.info("AdminController: Fetching all trial classes", { status, page, limit });

      const params: { status?: string; page: number; limit: number } = {
        page,
        limit,
      };
      if (status) params.status = status;

      const result = await this._adminService.getAllTrialClasses(params);

      logger.info(`AdminController: Found ${result.trialClasses.length} trial classes`);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result.trialClasses,
        pagination: result.pagination,
        message: "Trial classes fetched successfully",
      });
    } catch (error: unknown) {
      logger.error("AdminController: Error fetching all trial classes", error);
      next(error);
    }
  };

  getTrialClassDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trialClassId } = req.params;

      logger.info(`AdminController: Fetching trial class details - ${trialClassId}`);

      if (!trialClassId) {
        throw new AppError("Trial class ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const trialClass = await this._adminService.getTrialClassDetails(trialClassId);

      logger.info(`AdminController: Found trial class details for ${trialClassId}`);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: trialClass,
        message: "Trial class details fetched successfully",
      });
    } catch (error: unknown) {
      logger.error(`AdminController: Error fetching trial class details ${req.params.trialClassId}`, error);
      next(error);
    }
  };

  assignMentorToTrialClass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trialClassId } = req.params;
      const { mentorId, scheduledDate, scheduledTime } = req.body;

      logger.info(`AdminController: Assigning mentor to trial class - ${trialClassId}`, {
        mentorId,
        scheduledDate,
        scheduledTime,
      });

      if (!trialClassId || !mentorId || !scheduledDate || !scheduledTime) {
        throw new AppError(
          "Trial class ID, mentor ID, scheduled date, and scheduled time are required",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const result = await this._adminService.assignMentorToTrialClass(
        trialClassId,
        mentorId,
        scheduledDate,
        scheduledTime
      );

      logger.info(`AdminController: Mentor assigned successfully to trial class ${trialClassId}`);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
        message: "Mentor assigned successfully",
      });
    } catch (error: unknown) {
      logger.error(`AdminController: Error assigning mentor to trial class ${req.params.trialClassId}`, error);
      next(error);
    }
  };

  updateTrialClassStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { trialClassId } = req.params;
      const { status, reason } = req.body;

      logger.info(`AdminController: Updating trial class status - ${trialClassId}`, { status, reason });

      if (!trialClassId || !status) {
        throw new AppError("Trial class ID and status are required", HttpStatusCode.BAD_REQUEST);
      }

      const validStatuses = ["requested", "assigned", "completed", "cancelled"];
      if (!validStatuses.includes(status)) {
        throw new AppError(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          HttpStatusCode.BAD_REQUEST
        );
      }

      const result = await this._adminService.updateTrialClassStatus(trialClassId, status, reason);

      logger.info(`AdminController: Trial class status updated successfully for ${trialClassId}`);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
        message: "Trial class status updated successfully",
      });
    } catch (error: unknown) {
      logger.error(`AdminController: Error updating trial class status ${req.params.trialClassId}`, error);
      next(error);
    }
  };


  getAvailableMentors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { subjectId, preferredDate, days, timeSlot } = req.query;

      logger.info(`AdminController: Fetching available mentors`, { subjectId, preferredDate, days, timeSlot });

      if (!subjectId || typeof subjectId !== 'string') {
        throw new AppError("Subject ID is required", HttpStatusCode.BAD_REQUEST);
      }

      // Parse days if it comes as a string (which query params often do)
      let daysArray: string[] = [];
      if (Array.isArray(days)) {
        daysArray = days as string[];
      } else if (typeof days === 'string') {
        daysArray = days.split(',').map(d => d.trim());
      }

      const result = await this._adminService.getAvailableMentors(
        subjectId, 
        preferredDate as string,
        daysArray,
        timeSlot as string
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
        message: "Available mentors fetched successfully",
      });
    } catch (error) {
      logger.error("AdminController: Error fetching available mentors", error);
      next(error);
    }
  };

  searchStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        throw new AppError("Search query is required", HttpStatusCode.BAD_REQUEST);
      }
      const students = await this._adminService.searchStudents(query);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: students,
        message: "Students searched successfully"
      });
    } catch (error) {
      next(error);
    }
  };

  assignMentor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId, subjectId, mentorId, days, timeSlot } = req.body;
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.id;
      
      if (!studentId || !subjectId || !mentorId) {
        throw new AppError("Student ID, Subject ID, and Mentor ID are required", HttpStatusCode.BAD_REQUEST);
      }

      await this._adminService.assignMentor(studentId, subjectId, mentorId, adminId, {
         days,
         timeSlot
      });

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Mentor assigned successfully",
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  reassignMentor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { studentId, subjectId, newMentorId, days, timeSlot } = req.body;
      const authReq = req as AuthenticatedRequest;
      const adminId = authReq.user?.id;

      if (!studentId || !subjectId || !newMentorId) {
        throw new AppError("Student ID, Subject ID, and New Mentor ID are required", HttpStatusCode.BAD_REQUEST);
      }

      await this._adminService.reassignMentor(studentId, subjectId, newMentorId, adminId, {
        days,
        timeSlot
      });

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: "Mentor reassigned successfully",
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
