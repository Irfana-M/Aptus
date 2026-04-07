import { injectable, inject } from "inversify";
import type { Request, Response, NextFunction } from "express";
import { TYPES } from "../types";
import type { IStudentService } from "../interfaces/services/IStudentService";
import type { ISessionService } from "../interfaces/services/ISessionService";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import type { IMentorRequestService } from "../interfaces/services/IMentorRequestService";
import { MESSAGES } from "../constants/messages.constants";
import { UserRole } from "../enums/user.enum";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: UserRole;
  };
}

@injectable()
export class StudentController {
  constructor(
    @inject(TYPES.IStudentService) private _studentService: IStudentService,
    @inject(TYPES.IMentorRequestService) private _mentorRequestService: IMentorRequestService,
    @inject(TYPES.ISessionService) private _sessionService: ISessionService
  ) {}

  async updateProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (files?.profilePicture?.[0]) {
        req.body.profileImage = files.profilePicture[0];
      }
      
      if (files?.idProof?.[0]) {
        req.body.idProof = files.idProof[0];
      }

      const updatedProfile = await this._studentService.updateProfile(
        authReq.user.id,
        req.body
      );
      logger.info("Updated onboardingStatus:", updatedProfile.onboardingStatus);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.PROFILE_UPDATE_SUCCESS,
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
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      const profile = await this._studentService.getStudentProfileById(authReq.user.id);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.PROFILE_FETCH_SUCCESS,
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
        throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Student"), HttpStatusCode.BAD_REQUEST);
      }

      const profile = await this._studentService.getStudentProfileById(studentId);

      logger.info(`Admin fetched student profile for matching: ${studentId}`, { adminId: (req as any).user?.id });

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.PROFILE_FETCH_SUCCESS,
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
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      const { preferences } = req.body;
      const updatedProfile = await this._studentService.updatePreferences(
        authReq.user.id,
        preferences
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.PREFERENCES_UPDATE_SUCCESS,
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
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      const { subjectIds } = req.body;
      const updatedProfile = await this._studentService.updateBasicPreferences(
        authReq.user.id,
        subjectIds
      );

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.PREFERENCES_UPDATE_SUCCESS,
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
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      const { subjectId, mentorId } = req.body;
      await this._studentService.requestMentor(authReq.user.id, subjectId, mentorId);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.MENTOR_REQUEST_SUCCESS,
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
        throw new AppError(MESSAGES.AUTH.NOT_AUTHENTICATED, HttpStatusCode.UNAUTHORIZED);
      }

      const requests = await this._mentorRequestService.getRequestsByStudent(authReq.user.id);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.FETCH_SUCCESS,
        data: requests,
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  async getUpcomingSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      }

      logger.info(`📡 [API] Fetching upcoming sessions for Student: ${authReq.user.id}`);
      const eligibilityData = await this._sessionService.getStudentUpcomingSessionsWithEligibility(authReq.user.id);
      logger.info(`✅ [API] Returning ${eligibilityData.sessions.length} upcoming sessions with eligibility`);

      res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.FETCH_SUCCESS,
        data: eligibilityData,
      });
    } catch (error: unknown) {
      next(error);
    }
  }
}
