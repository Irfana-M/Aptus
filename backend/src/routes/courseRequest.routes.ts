import { Router } from 'express';
import { CourseRequestController } from '../controllers/courseRequest.controller';
import { requireAuth } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/role.middleware';

import { TYPES } from '../types';
import { container } from '../inversify.config';

const router = Router();
const controller = container.get<CourseRequestController>(TYPES.CourseRequestController);


router.post('/', requireAuth, controller.createRequest);
router.get('/my-requests', requireAuth, controller.getMyRequests);


router.get('/all', requireAuth, requireRole('admin'), controller.getAllRequests);
router.patch('/:id/status', requireAuth, requireRole('admin'), controller.updateStatus);

export default router;
