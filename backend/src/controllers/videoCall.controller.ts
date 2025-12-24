import type { Request, Response } from 'express';
import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { IVideoCallService } from "@/interfaces/services/IVideoCallService";
import { logger } from "@/utils/logger";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from '@/constants/httpStatus';

@injectable()
export class VideoCallController {
  constructor(@inject(TYPES.IVideoCallService) private videoCallService: IVideoCallService) {}

  startCall = async (req: Request, res: Response) => {
    try {
      const { trialClassId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      
      if (!['mentor', 'student'].includes(userRole)) {
        throw new AppError("Only mentors and students can start video calls", HttpStatusCode.FORBIDDEN);
      }
      
      if (!trialClassId) throw new AppError("Trial Class ID is required", HttpStatusCode.BAD_REQUEST);

      const result = await this.videoCallService.initializeCall(
        trialClassId, 
        userId, 
        userRole as 'mentor' | 'student'
      );
      res.status(HttpStatusCode.OK).json({ 
        success: true, 
        data: { meetLink: result.meetLink, callStatus: 'active' }, 
        message: 'Video call started successfully' 
      });
    } catch (error: unknown) {
      logger.error('Error starting call', error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(status).json({ success: false, message });
    }
  };

  getCallStatus = async (req: Request, res: Response) => {
    try {
      const { trialClassId } = req.params;
      if (!trialClassId) throw new AppError("Trial Class ID is required", HttpStatusCode.BAD_REQUEST);

      res.set('Cache-Control', 'no-store');
      res.set('ETag', Date.now().toString()); 

      const status = await this.videoCallService.getCallStatus(trialClassId);
      res.status(HttpStatusCode.OK).json({ success: true, data: status });
    } catch (error: unknown) {
      logger.error('Error getting call status', error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(status).json({ success: false, message });
    }
  };

  endCall = async (req: Request, res: Response) => {
    try {
      const { trialClassId } = req.params;
      const userId = req.user!.id;
      const { reason } = req.body;
      if (!trialClassId) throw new AppError("Trial Class ID is required", HttpStatusCode.BAD_REQUEST);

      const result = await this.videoCallService.endCall({ trialClassId, endedBy: userId, reason });
      res.status(HttpStatusCode.OK).json({ success: result.success, message: 'Call ended successfully' });
    } catch (error: unknown) {
      logger.error('Error ending call', error);
      const status = error instanceof AppError ? error.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR;
      const message = error instanceof Error ? error.message : 'Internal server error';
      res.status(status).json({ success: false, message });
    }
  };
}