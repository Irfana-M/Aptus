import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { Request, Response, NextFunction } from "express";
import type { IAdminService } from "../interfaces/services/IAdminService.js";
import { logger } from "../utils/logger.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.constants.js";
import { generateAccessToken, verifyRefreshToken } from "@/utils/jwt.util.js";
import { AppError } from "@/utils/AppError.js";
import { config } from "../config/app.config.js";
import { getPaginationParams, formatStandardizedPaginatedResult } from "@/utils/pagination.util.js";
import type { MentorPaginationParams, StudentPaginationParams } from "@/dtos/shared/paginationTypes.js";
import { UserRole } from "@/enums/user.enum.js";
import { ApprovalStatus } from "@/domain/enums/ApprovalStatus.js";
import { StudentStatus } from "@/enums/student.enum.js";
import { UserVerificationStatus } from "@/enums/userVerification.enum.js";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
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
          message: MESSAGES.COMMON.REQUIRED_FIELDS(["Full name", "email"]),
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
        message: MESSAGES.ADMIN.STUDENT_ADDED,
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
          MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED,
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const payload = verifyRefreshToken(refreshToken);
      console.log("🔐 Backend Refresh - Token payload:", payload);
      if (!payload || payload.role !== UserRole.ADMIN) {
        throw new AppError(
          MESSAGES.ADMIN.UNAUTHORIZED_REFRESH,
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
        message: MESSAGES.ADMIN.REFRESH_SUCCESS,
      });
    } catch (error: unknown) {
     
      res.clearCookie("adminRefreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      next(
        error instanceof AppError
          ? error
          : new AppError(
              MESSAGES.ADMIN.REFRESH_FAILED,
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
        message: MESSAGES.AUTH.LOGIN_SUCCESS,
      });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Admin login failed: ${req.body.email} - ${errorTyped.message}`);
      res.status(HttpStatusCode.UNAUTHORIZED).json({ message: errorTyped.message });
    }
  };

  getDashboardData = async (_req: Request, res: Response) => {
    try {
      logger.info("Fetching dashboard data");
      const dashboardData = await this._adminService.getDashboardData();
      logger.info("Dashboard data fetched successfully");
      res.status(HttpStatusCode.OK).json(dashboardData);
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Error fetching dashboard data: ${errorTyped.message}`);
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: errorTyped.message });
    }
  };

  getAllMentors = async (req: Request, res: Response) => {
    try {
      const { page, limit, ..._otherParams } = getPaginationParams(req.query);
      const search = req.query.search as string | undefined;
      const status = req.query.status as ApprovalStatus | '' | undefined;
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
      
      const formattedResult = formatStandardizedPaginatedResult(
        result.data,
        result.pagination.totalItems,
        { page, limit },
        MESSAGES.ADMIN.MENTORS_FETCH_SUCCESS
      );

      return res.status(HttpStatusCode.OK).json(formattedResult);
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Error fetching mentors: ${errorTyped.message}`);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorTyped.message,
      });
    }
  };

  getAllStudents = async (req: Request, res: Response) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const search = req.query.search as string | undefined;
      const status = req.query.status as StudentStatus | '' | undefined;
      const verification = req.query.verification as UserVerificationStatus | '' | undefined;

      logger.info("Admin: Fetching students with pagination/filters", { page, limit, search, status, verification });
      
      const paginationParams: StudentPaginationParams = {
        page,
        limit,
      };
      if (search) paginationParams.search = search;
      if (status) paginationParams.status = status;
      if (verification) paginationParams.verification = verification;

      const result = await this._adminService.getAllStudentsPaginated(paginationParams);
      
      const formattedResult = formatStandardizedPaginatedResult(
        result.data,
        result.pagination.totalItems,
        { page, limit },
        MESSAGES.ADMIN.STUDENTS_FETCH_SUCCESS
      );

      return res.status(HttpStatusCode.OK).json(formattedResult);
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Error fetching students: ${errorTyped.message}`);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: errorTyped.message,
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
        .json({ message: MESSAGES.COMMON.ID_REQUIRED("Mentor") });
    }
    try {
      logger.info(`Fetching mentor profile: ${mentorId}`);
      const mentor = await this._adminService.fetchMentorProfile(mentorId);
      if (!mentor) {
        logger.warn(`Mentor not found: ${mentorId}`);
        return res
          .status(HttpStatusCode.NOT_FOUND)
          .json({ message: MESSAGES.AUTH.USER_NOT_FOUND });
      }
      logger.info(`✅ [AdminController] Successfully fetched mentor profile for: ${mentorId}`);
      res.status(HttpStatusCode.OK).json(mentor);
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(
        `Error fetching mentor profile ${mentorId}: ${errorTyped.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: errorTyped.message });
    }
  };

  approveMentor = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: MESSAGES.COMMON.ID_REQUIRED("Mentor") });
    }
    const authReq = req as AuthenticatedRequest;
    const adminId = authReq.user?.id;
    if (!adminId) {
      logger.warn("Admin ID is missing in request");
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: MESSAGES.COMMON.UNAUTHORIZED });
    }
    try {
      logger.info(`Admin ${adminId} approving mentor: ${mentorId}`);
      const approvalResult = await this._adminService.updateMentorApprovalStatus(
        mentorId,
        ApprovalStatus.APPROVED,
        adminId
      );
      logger.info(`Mentor ${mentorId} approved by admin ${adminId}`);
      res.status(HttpStatusCode.OK).json(approvalResult);
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(
        `Error approving mentor ${mentorId} by admin ${adminId}: ${errorTyped.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: errorTyped.message });
    }
  };

  rejectMentor = async (req: Request, res: Response) => {
    const mentorId = req.params.mentorId;
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json({ message: MESSAGES.COMMON.ID_REQUIRED("Mentor") });
    }
    const { reason } = req.body;
    const adminId = (req as AuthenticatedRequest).user?.id;
    if (!adminId) {
      logger.warn("Admin ID is missing in request");
      return res
        .status(HttpStatusCode.UNAUTHORIZED)
        .json({ message: MESSAGES.COMMON.UNAUTHORIZED });
    }
    try {
      logger.info(
        `Admin ${adminId} rejecting mentor: ${mentorId}, Reason: ${reason}`
      );
      const rejectionResult = await this._adminService.updateMentorApprovalStatus(
        mentorId,
        ApprovalStatus.REJECTED,
        adminId,
        reason
      );
      logger.info(`Mentor ${mentorId} rejected by admin ${adminId}`);
      res.status(HttpStatusCode.OK).json(rejectionResult);
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(
        `Error rejecting mentor ${mentorId} by admin ${adminId}: ${errorTyped.message}`
      );
      res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ message: errorTyped.message });
    }
  };


  blockMentor = async (req: Request, res: Response): Promise<void> => {
    const mentorId = req.params.mentorId;
    
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.COMMON.ID_REQUIRED("Mentor"),
      });
      return;
    }

    try {
      logger.info(`Blocking mentor: ${mentorId}`);
      const blockResult = await this._adminService.blockMentor(mentorId);
      
      logger.info(`Mentor blocked successfully: ${mentorId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: blockResult,
        message: MESSAGES.ADMIN.MENTOR_BLOCKED,
      });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Error blocking mentor ${mentorId}: ${errorTyped.message}`);
      const statusCode = errorTyped.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: errorTyped.message,
      });
    }
  };


unblockMentor = async (req: Request, res: Response): Promise<void> => {
    const mentorId = req.params.mentorId;
    
    if (!mentorId) {
      logger.warn("Mentor ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.COMMON.ID_REQUIRED("Mentor"),
      });
      return;
    }

    try {
      logger.info(`Unblocking mentor: ${mentorId}`);
      const unblockResult = await this._adminService.unblockMentor(mentorId);
      
      logger.info(`Mentor unblocked successfully: ${mentorId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: unblockResult,
        message: MESSAGES.ADMIN.MENTOR_UNBLOCKED,
      });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Error unblocking mentor ${mentorId}: ${errorTyped.message}`);
      const statusCode = errorTyped.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: errorTyped.message,
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
        message: MESSAGES.COMMON.REQUIRED_FIELDS(["Full name", "email"]),
      });
      return;
    }

    const addMentorResult = await this._adminService.addMentor({
      fullName,
      email,
      phoneNumber,
      location,
      bio,
    });

    logger.info(`Admin: Mentor added successfully - ${email}`);

    res.status(HttpStatusCode.CREATED).json({
      success: true,
      message: MESSAGES.ADMIN.MENTOR_ADDED,
      data: addMentorResult,
    });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Admin: Add mentor error for ${req.body.email}:`, errorTyped);
      const statusCode = errorTyped.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: errorTyped.message,
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
        message: MESSAGES.COMMON.ID_REQUIRED("Mentor"),
      });
      return;
    }

    const updateMentorResult = await this._adminService.updateMentor(mentorId, updateData);

    logger.info(`Admin: Mentor updated successfully - ${mentorId}`);

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: MESSAGES.ADMIN.MENTOR_UPDATED,
      data: updateMentorResult,
    });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Admin: Update mentor error for ${req.params.mentorId}:`, errorTyped);
      const statusCode = errorTyped.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: errorTyped.message,
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
        message: MESSAGES.COMMON.ID_REQUIRED("Student"),
      });
      return;
    }

    const updateStudentResult = await this._adminService.updateStudent(studentId, updateData);

    logger.info(`Admin: Student updated successfully - ${studentId}`);

    res.status(HttpStatusCode.OK).json({
      success: true,
      message: MESSAGES.ADMIN.STUDENT_UPDATED,
      data: updateStudentResult,
    });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Admin: Update student error for ${req.params.studentId}:`, errorTyped);
      const statusCode = errorTyped.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: errorTyped.message,
      });
    }
};


   blockStudent = async (req: Request, res: Response): Promise<void> => {
    const studentId = req.params.studentId;
    
    if (!studentId) {
      logger.warn("Student ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.COMMON.ID_REQUIRED("Student"),
      });
      return;
    }

    try {
      logger.info(`Blocking student: ${studentId}`);
      const blockStudentResult = await this._adminService.blockStudent(studentId);
      
      logger.info(`Student blocked successfully: ${studentId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: blockStudentResult,
        message: MESSAGES.ADMIN.STUDENT_BLOCKED,
      });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Error blocking student ${studentId}: ${errorTyped.message}`);
      const statusCode = errorTyped.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: errorTyped.message,
      });
    }
  };

  unblockStudent = async (req: Request, res: Response): Promise<void> => {
    const studentId = req.params.studentId;
    
    if (!studentId) {
      logger.warn("Student ID is missing in request");
      res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.COMMON.ID_REQUIRED("Student"),
      });
      return;
    }

    try {
      logger.info(`Unblocking student: ${studentId}`);
      const unblockStudentResult = await this._adminService.unblockStudent(studentId);
      
      logger.info(`Student unblocked successfully: ${studentId}`);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: unblockStudentResult,
        message: MESSAGES.ADMIN.STUDENT_UNBLOCKED,
      });
    } catch (error: unknown) {
      const errorTyped = error as AppError;
      logger.error(`Error unblocking student ${studentId}: ${errorTyped.message}`);
      const statusCode = errorTyped.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      res.status(statusCode).json({
        success: false,
        message: errorTyped.message,
      });
    }
  };


   getStudentsWithTrialStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = getPaginationParams(req.query);

      logger.info(`AdminController: Fetching students with trial stats - Page: ${page}, Limit: ${limit}`);

      const result = await (this._adminService as any).getStudentsWithTrialStats(page, limit);

      const formattedResult = formatStandardizedPaginatedResult(
        result.data.students,
        result.data.pagination.totalStudents,
        { page, limit },
        MESSAGES.ADMIN.FETCH_SUCCESS
      );

      logger.info(`AdminController: Successfully fetched students with trial stats`);

      res.status(HttpStatusCode.OK).json(formattedResult);
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
      throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Student"), HttpStatusCode.BAD_REQUEST);
    }

    // Add try-catch around the service call
    const trialClasses = await this._adminService.getStudentTrialClasses(studentId, status as string);

    logger.info(`AdminController: Found ${trialClasses.length} trial classes for student ${studentId}`);

    res.status(HttpStatusCode.OK).json({
      success: true,
      data: trialClasses,
      count: trialClasses.length,
      message: MESSAGES.ADMIN.TRIAL_CLASSES_FETCH_SUCCESS,
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

      const formattedResult = formatStandardizedPaginatedResult(
        result.trialClasses,
        result.pagination.totalTrialClasses,
        { page, limit },
        MESSAGES.ADMIN.TRIAL_CLASSES_FETCH_SUCCESS
      );

      res.status(HttpStatusCode.OK).json(formattedResult);
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
        throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Trial class"), HttpStatusCode.BAD_REQUEST);
      }

      const trialClass = await this._adminService.getTrialClassDetails(trialClassId);

      logger.info(`AdminController: Found trial class details for ${trialClassId}`);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: trialClass,
        message: MESSAGES.ADMIN.TRIAL_CLASS_DETAILS_FETCH_SUCCESS,
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
          MESSAGES.COMMON.REQUIRED_FIELDS(["Trial class ID", "mentor ID", "scheduled date", "scheduled time"]),
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
        message: MESSAGES.ADMIN.MENTOR_ASSIGNED_SUCCESS,
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
        throw new AppError(MESSAGES.COMMON.REQUIRED_FIELDS(["Trial class ID", "status"]), HttpStatusCode.BAD_REQUEST);
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
        message: MESSAGES.ADMIN.STATUS_UPDATE_SUCCESS,
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
        throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Subject"), HttpStatusCode.BAD_REQUEST);
      }

      // Parse days if it comes as a string (which query params often do)
      let daysArray: string[] = [];
      if (Array.isArray(days)) {
        daysArray = days as string[];
      } else if (typeof days === 'string') {
        daysArray = days.split(',').map(day => day.trim());
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
        message: MESSAGES.ADMIN.AVAILABLE_MENTORS_FETCH_SUCCESS,
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

      const responseBody = {
        success: true,
        message: "Mentor assigned successfully",
      };
      logger.info(`[AdminController.assignMentor] Final Response:`, responseBody);
      res.status(HttpStatusCode.OK).json(responseBody);
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

      const responseBody = {
        success: true,
        message: "Mentor reassigned successfully",
      };
      logger.info(`[AdminController.reassignMentor] Final Response:`, responseBody);
      res.status(HttpStatusCode.OK).json(responseBody);
    } catch (error: unknown) {
      next(error);
    }
  };
}
