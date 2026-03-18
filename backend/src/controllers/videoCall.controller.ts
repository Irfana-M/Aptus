import type { Request, Response } from 'express';
import { injectable, inject } from "inversify";
import { TYPES } from "@/types.js";
import type { IVideoCallService } from "@/interfaces/services/IVideoCallService.js";
import { logger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";
import { HttpStatusCode } from '@/constants/httpStatus.js';
import { MESSAGES } from '@/constants/messages.constants.js';
import { UserRole } from '@/enums/user.enum.js';
import { CallStatus } from '@/enums/videoCall.enum.js';



@injectable()
export class VideoCallController {
  constructor(@inject(TYPES.IVideoCallService) private _videoCallService: IVideoCallService) { }

  startCall = async (req: Request, res: Response) => {
    try {
      const { trialClassId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role as UserRole;


      if (![UserRole.MENTOR, UserRole.STUDENT].includes(userRole)) {
        throw new AppError(MESSAGES.VIDEO_CALL.UNAUTHORIZED_ROLE, HttpStatusCode.FORBIDDEN);
      }

      if (!trialClassId) throw new AppError(MESSAGES.TRIAL_CLASS.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);

      const result = await this._videoCallService.initializeCall(
        trialClassId,
        userId,
        userRole as UserRole.MENTOR | UserRole.STUDENT
      );
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { meetLink: result.meetLink, callStatus: CallStatus.ACTIVE },
        message: MESSAGES.VIDEO_CALL.START_SUCCESS
      });
    } catch (error: unknown) {
      logger.error('Error starting call', error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  getCallStatus = async (req: Request, res: Response) => {
    try {
      const { trialClassId } = req.params;
      if (!trialClassId) throw new AppError(MESSAGES.TRIAL_CLASS.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);

      res.set('Cache-Control', 'no-store');
      res.set('ETag', Date.now().toString());

      const status = await this._videoCallService.getCallStatus(trialClassId);
      res.status(HttpStatusCode.OK).json({ success: true, data: status });
    } catch (error: unknown) {
      logger.error('Error getting call status', error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };

  endCall = async (req: Request, res: Response) => {
    try {
      const { trialClassId } = req.params;
      const userId = req.user!.id;
      const { reason } = req.body;
      if (!trialClassId) throw new AppError(MESSAGES.TRIAL_CLASS.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);

      const result = await this._videoCallService.endCall({
        sessionId: trialClassId,
        endedBy: userId,
        reason
      });
      res.status(HttpStatusCode.OK).json({ success: result.success, message: MESSAGES.VIDEO_CALL.END_SUCCESS });
    } catch (error: unknown) {
      logger.error('Error ending call', error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.INTERNAL_SERVER_ERROR;
      res.status(status).json({ success: false, message });
    }
  };
}