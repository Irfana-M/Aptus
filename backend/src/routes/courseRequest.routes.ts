import { Router } from 'express';
import { CourseRequestController } from '../controllers/courseRequest.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

import { TYPES } from '../types.js';
import { container } from '../inversify.config.js';

const router = Router();
const controller = container.get<CourseRequestController>(TYPES.CourseRequestController);


router.post('/', requireAuth, controller.createRequest);
router.get('/my-requests', requireAuth, controller.getMyRequests);


router.get('/all', requireAuth, requireRole('admin'), controller.getAllRequests);
router.patch('/:id/status', requireAuth, requireRole('admin'), controller.updateStatus);

export default router;
