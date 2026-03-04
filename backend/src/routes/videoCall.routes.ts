import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { container } from '../inversify.config.js';
import { TYPES } from '../types.js';


import type { VideoCallController } from '../controllers/videoCall.controller.js';

const videoRouter = express.Router();


const videoCallController = container.get<VideoCallController>(TYPES.VideoCallController);

videoRouter.post('/initialize', requireAuth, requireRole(["mentor", "student"]), videoCallController.startCall);
videoRouter.get('/status/:trialClassId', requireAuth, requireRole(["mentor", "student", "admin"]), videoCallController.getCallStatus);
videoRouter.post('/end', requireAuth, requireRole(["mentor", "student"]), videoCallController.endCall);

export default videoRouter;