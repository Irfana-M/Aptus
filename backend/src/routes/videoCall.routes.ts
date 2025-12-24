import express from 'express';
import { requireAuth } from '@/middleware/authMiddleware';
import { requireRole } from '@/middleware/role.middleware';
import { container } from '@/inversify.config';
import { TYPES } from '@/types';


import type { VideoCallController } from '@/controllers/videoCall.controller';

const videoRouter = express.Router();


const videoCallController = container.get<VideoCallController>(TYPES.VideoCallController);

videoRouter.post('/initialize', requireAuth, requireRole(["mentor", "student"]), videoCallController.startCall);
videoRouter.get('/status/:trialClassId', requireAuth, requireRole(["mentor", "student", "admin"]), videoCallController.getCallStatus);
videoRouter.post('/end', requireAuth, requireRole(["mentor", "student"]), videoCallController.endCall);

export default videoRouter;