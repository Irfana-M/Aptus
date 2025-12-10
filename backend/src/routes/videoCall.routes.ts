import express from 'express';
import { requireAuth } from '@/middleware/authMiddleware';
import { container } from '@/inversify.config';
import { TYPES } from '@/types';


import type { VideoCallController } from '@/controllers/videoCall.controller';

const videoRouter = express.Router();


const videoCallController = container.get<VideoCallController>(TYPES.VideoCallController);

videoRouter.post('/initialize', requireAuth, videoCallController.startCall);
videoRouter.get('/status/:trialClassId', requireAuth, videoCallController.getCallStatus);
videoRouter.post('/end', requireAuth, videoCallController.endCall);

export default videoRouter;