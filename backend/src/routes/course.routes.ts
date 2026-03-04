import { Router } from 'express';
import { TYPES } from '../types.js';
import { container } from '../inversify.config.js';
import { CourseController } from '../controllers/course.controller.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();
const controller = container.get<CourseController>(TYPES.CourseController);


router.get('/available', requireAuth, controller.getAvailableCourses);
router.get('/:id', requireAuth, controller.getCourseById);

export default router;
