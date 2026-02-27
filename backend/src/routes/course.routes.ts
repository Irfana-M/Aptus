import { Router } from 'express';
import { TYPES } from '../types';
import { container } from '../inversify.config';
import { CourseController } from '../controllers/course.controller';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();
const controller = container.get<CourseController>(TYPES.CourseController);


router.get('/available', requireAuth, controller.getAvailableCourses);
router.get('/:id', requireAuth, controller.getCourseById);

export default router;
