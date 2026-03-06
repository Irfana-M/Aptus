import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { Request, Response } from "express";
import type { IMentorService } from "../interfaces/services/IMentorService.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { logger } from "../utils/logger.js";
import { MESSAGES } from "../constants/messages.constants.js";
import { getPaginationParams, formatStandardizedPaginatedResult } from "../utils/pagination.util.js";

@injectable()
export class MentorController {
  constructor(
    @inject(TYPES.IMentorService) private _mentorService: IMentorService
  ) {}

  updateProfile = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        logger.error("updateProfile: Missing mentorId in request");
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.INVALID_AUTH,
        });
      }

      logger.info(`Starting profile update for mentor: ${mentorId}`);

      const updatedData = { ...req.body };

      if (req.file) {
        updatedData.profilePicture = req.file;
        logger.debug(
          `Profile picture file received: ${req.file.originalname}, stored as: ${req.file.filename}`
        );
      }

      const updatedProfile = await this._mentorService.updateMentorProfile(
        mentorId,
        updatedData
      );

      logger.info(`Mentor profile updated successfully: ${mentorId}`);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.STUDENT.PROFILE_UPDATE_SUCCESS,
        data: updatedProfile,
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(
        `Error in updateProfile for mentor ${req.user?.id}: ${err.message}`,
        { error: err.stack }
      );
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || MESSAGES.STUDENT.PROFILE_UPDATE_FAILED,
      });
    }
  };

  getProfile = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        logger.error("getProfile: Missing mentorId in request");
        return res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.COMMON.INVALID_AUTH,
        });
      }

      logger.info(`Fetching profile for mentor: ${mentorId}`);
      const profile = await this._mentorService.getMentorProfile(mentorId);

      if (!profile) {
        return res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: MESSAGES.AUTH.USER_NOT_FOUND,
        });
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: profile,
      });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getProfile for mentor ${req.user?.id}: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || MESSAGES.STUDENT.FETCH_FAILED,
      });
    }
  };

  submitForApproval = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      const requestingUserId = req.user?.id;
      if (!mentorId || !requestingUserId) {
        logger.error(`submitForApproval: Missing mentorId or requestingUserId`);
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: MESSAGES.MENTOR.INVALID_USER });
      }

      const result = await this._mentorService.submitProfileForApproval(
        mentorId,
        requestingUserId
      );
      logger.info(`Mentor ${mentorId} submitted profile for approval`);
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in submitForApproval: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  };

  getPending = async (req: Request, res: Response) => {
    try {
      const pending = await this._mentorService.getPendingMentors();
      logger.info(`Fetched ${pending.length} pending mentors`);
      return res
        .status(HttpStatusCode.OK)
        .json({ success: true, data: pending });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getPending: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  };

  approve = async (req: Request, res: Response) => {
    try {
      const mentorId = req.params.mentorId;
      const adminId = req.user?.id;

      if (!mentorId || !adminId) {
        logger.error("approve: Missing mentorId or adminId");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: MESSAGES.MENTOR.INVALID_REQUEST });
      }

      const result = await this._mentorService.approveMentor(mentorId, adminId);
      logger.info(`Mentor approved: ${mentorId} by admin: ${adminId}`);
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`approve error: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  };

  reject = async (req: Request, res: Response) => {
    try {
      const mentorId = req.params.mentorId;
      const adminId = req.user?.id;
      const { reason } = req.body;

      if (!mentorId || !adminId || !reason) {
        logger.error("reject: Missing mentorId, adminId, or reason");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: MESSAGES.MENTOR.INVALID_REQUEST });
      }

      const result = await this._mentorService.rejectMentor(
        mentorId,
        reason,
        adminId
      );

      logger.info(
        `Mentor rejected: ${mentorId} by admin: ${adminId}, reason: ${reason}`
      );
      return res.status(HttpStatusCode.OK).json({ success: true, ...result });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`reject error: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  };
  getTrialClasses = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        logger.error("getTrialClasses: Missing mentorId");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: MESSAGES.MENTOR.INVALID_USER });
      }

      const { page, limit } = getPaginationParams(req.query);

      const { items, total } = await this._mentorService.getMentorTrialClasses(mentorId, page, limit);
      
      const result = formatStandardizedPaginatedResult(
        items,
        total,
        { page, limit },
        MESSAGES.COMMON.DATA_FETCHED
      );

      logger.info(`Fetched ${items.length} trial classes for mentor ${mentorId}`);
      return res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getTrialClasses: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  };

  getAvailableSlots = async (req: Request, res: Response) => {
    try {
      const mentorId = req.params.mentorId;
      if (!mentorId) {
        logger.error("getAvailableSlots: Missing mentorId");
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ success: false, message: MESSAGES.MENTOR.ID_REQUIRED });
      }

      const slots = await this._mentorService.getMentorAvailableSlots(mentorId);
      logger.info(`Fetched available slots for mentor ${mentorId}`);
      return res.status(HttpStatusCode.OK).json({ success: true, data: slots });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getAvailableSlots: ${err.message}`);
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json({ success: false, message: err.message });
    }
  };

  requestLeave = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: MESSAGES.MENTOR.UNAUTHORIZED });
      }

      const { startDate, endDate, reason } = req.body;
      if (!startDate || !endDate) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: MESSAGES.COMMON.REQUIRED_FIELDS(["startDate", "endDate"]) });
      }

      await this._mentorService.requestLeave(mentorId, new Date(startDate), new Date(endDate), reason);
      return res.status(HttpStatusCode.CREATED).json({ success: true, message: MESSAGES.MENTOR.LEAVE_REQUEST_SUCCESS });
    } catch (error: unknown) {
      const err = error as Error;
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  approveLeave = async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      const { mentorId, leaveId } = req.params;

      if (!adminId || !leaveId) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: MESSAGES.MENTOR.MISSING_PARAMS });
      }

      await this._mentorService.approveLeave(mentorId, leaveId, adminId);
      return res.status(HttpStatusCode.OK).json({ success: true, message: MESSAGES.MENTOR.LEAVE_APPROVE_SUCCESS });
    } catch (error: unknown) {
      const err = error as Error;
      const statusCode = (err as any).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      return res.status(statusCode).json({ success: false, message: err.message });
    }
  };

  rejectLeave = async (req: Request, res: Response) => {
    try {
      const adminId = req.user?.id;
      const { mentorId, leaveId } = req.params;
      const { reason } = req.body;

      if (!adminId || !leaveId || !reason) {
        return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: MESSAGES.MENTOR.MISSING_PARAMS });
      }

      await this._mentorService.rejectLeave(mentorId, leaveId, adminId, reason);
      return res.status(HttpStatusCode.OK).json({ success: true, message: MESSAGES.MENTOR.LEAVE_REJECT_SUCCESS });
    } catch (error: unknown) {
      const err = error as Error;
      const statusCode = (err as any).statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR;
      return res.status(statusCode).json({ success: false, message: err.message });
    }
  };

  getDailySessions = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: MESSAGES.MENTOR.UNAUTHORIZED });
      }

      // Default to today if no date provided
      const dateParam = req.query.date as string | undefined;
      const date = dateParam ? new Date(dateParam) : new Date();

      if (isNaN(date.getTime())) {
          return res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: MESSAGES.MENTOR.INVALID_DATE });
      }

      const sessions = await this._mentorService.getMentorDailySessions(mentorId, date);
      
      return res.status(HttpStatusCode.OK).json({ success: true, data: sessions });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getDailySessions: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  getUpcomingSessions = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: MESSAGES.MENTOR.UNAUTHORIZED });
      }

      const result = await this._mentorService.getMentorUpcomingSessionsWithEligibility(mentorId);
      
      return res.status(HttpStatusCode.OK).json({ success: true, data: result });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getUpcomingSessions: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  // Get only one-to-one students
  getOneToOneStudents = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: MESSAGES.MENTOR.UNAUTHORIZED });
      }

      const students = await this._mentorService.getOneToOneStudents(mentorId);
      return res.status(HttpStatusCode.OK).json({ success: true, data: students });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getOneToOneStudents: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  // Get only group batches
  getGroupBatches = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: MESSAGES.MENTOR.UNAUTHORIZED });
      }

      const batches = await this._mentorService.getGroupBatches(mentorId);
      return res.status(HttpStatusCode.OK).json({ success: true, data: batches });
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getGroupBatches: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  getMyLeaves = async (req: Request, res: Response) => {
    try {
      const mentorId = req.user?.id;
      if (!mentorId) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({ success: false, message: MESSAGES.MENTOR.UNAUTHORIZED });
      }

      const { page, limit } = getPaginationParams(req.query);
      const status = req.query.status as any;

      const { items, total } = await this._mentorService.getPaginatedLeaves({
        page,
        limit,
        mentorId,
        status
      });

      const result = formatStandardizedPaginatedResult(
        items,
        total,
        { page, limit },
        MESSAGES.COMMON.DATA_FETCHED
      );

      return res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getMyLeaves: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };

  getAllLeaves = async (req: Request, res: Response) => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      const mentorId = req.query.mentorId as string;
      const status = req.query.status as any;

      const { items, total } = await this._mentorService.getPaginatedLeaves({
        page,
        limit,
        mentorId,
        status
      });

      const result = formatStandardizedPaginatedResult(
        items,
        total,
        { page, limit },
        MESSAGES.COMMON.DATA_FETCHED
      );

      return res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Error in getAllLeaves: ${err.message}`);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: err.message });
    }
  };
}
