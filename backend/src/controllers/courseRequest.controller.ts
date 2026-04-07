import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from 'express';
import type { ICourseRequestService } from '../interfaces/services/ICourseRequestService';
import { getPaginationParams } from "@/utils/pagination.util";
import { logger } from "@/utils/logger";
import { HttpStatusCode } from "@/constants/httpStatus";
import { MESSAGES } from "@/constants/messages.constants";
import { UserRole } from "@/enums/user.enum";

interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    userId?: string; 
  }
}

@injectable()
export class CourseRequestController {
  constructor(
    @inject(TYPES.ICourseRequestService) private _service: ICourseRequestService
  ) {}
  
  public createRequest = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const studentId = authReq.user?.userId || authReq.user?.id;
      if (!studentId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ message: MESSAGES.COMMON.UNAUTHORIZED });
        return;
      }

      const { subject, grade, mentoringMode, preferredDays, timeSlot, timeRange, timezone, mentorId } = req.body;

      
      const finalTimeSlot = timeSlot || timeRange;

      if (!subject || !grade || !mentoringMode || !preferredDays || !finalTimeSlot) {
        console.error('❌ [DEBUG] Missing required fields', { subject, grade, mentoringMode, preferredDays, finalTimeSlot });
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.COMMON.REQUIRED_FIELDS(['subject', 'grade', 'mentoringMode', 'preferredDays', 'timeSlot']) });
        return;
      }
      
      if (!Array.isArray(preferredDays) || preferredDays.length === 0) {
           console.error('❌ [DEBUG] preferredDays must be a non-empty array');
           res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.STUDENT.PREFERENCE_REQUIRED });
           return;
      }

      const requestData = {
        subject,
        grade,
        mentoringMode,
        preferredDays,
        timeSlot: finalTimeSlot,
        timezone,
        mentor: mentorId 
      };
      
      console.log('📝 [DEBUG] Data to service:', requestData);

      const savedRequest = await this._service.createRequest(studentId, requestData);

      console.log('✅ [DEBUG] Saved request:', savedRequest);

      res.status(HttpStatusCode.CREATED).json({
        message: MESSAGES.STUDENT.MENTOR_REQUEST_SUCCESS,
        data: savedRequest
      });
    } catch (error: unknown) {
      console.error('❌ [DEBUG] Error creating course request:', error);
      if (error instanceof Error && error.name === 'ValidationError') {
           res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.ADMIN.VALIDATION_FAILED, error: error.message });
           return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', error: message });
    }
  }

  
  public getAllRequests = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { page, limit } = getPaginationParams(req.query);
      logger.info(`Fetching paginated course requests - Page: ${page}, Limit: ${limit}`);

      const result = await this._service.getAllRequestsPaginated({ page, limit });

      res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      console.error('Error fetching course requests:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error', error: message });
    }
  }

  
  public getMyRequests = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
      try {
          const authReq = req as AuthRequest;
          const studentId = authReq.user?.userId || authReq.user?.id;
          
          if (!studentId) {
              res.status(HttpStatusCode.UNAUTHORIZED).json({ message: MESSAGES.COMMON.UNAUTHORIZED });
              return;
          }

          const requests = await this._service.getMyRequests(studentId);

          res.status(HttpStatusCode.OK).json({
              message: MESSAGES.STUDENT.FETCH_SUCCESS,
              data: requests
          });
      } catch (error: unknown) {
        console.error('Error fetching my course requests:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', error: message });
    }
  }

  
  public updateStatus = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!id) {
          res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.COMMON.ID_REQUIRED("Request") });
          return;
      }

      const updatedRequest = await this._service.updateStatus(id, status);

      if (!updatedRequest) {
        res.status(HttpStatusCode.NOT_FOUND).json({ message: MESSAGES.ADMIN.RESOURCE_NOT_FOUND("Request") });
        return;
      }

      res.status(HttpStatusCode.OK).json({
        message: MESSAGES.ADMIN.STATUS_UPDATE_SUCCESS,
        data: updatedRequest
      });
    } catch (error: unknown) {
      console.error('Error updating request status:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message === "Invalid status") {
          res.status(HttpStatusCode.BAD_REQUEST).json({ message });
          return;
      }
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message: 'Internal server error', error: message });
    }
  }
}

