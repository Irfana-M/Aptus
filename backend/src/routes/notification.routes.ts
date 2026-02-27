
import { Router } from 'express';
import { container } from '../inversify.config';
import { TYPES } from '../types';
import { NotificationController } from '../controllers/notification.controller';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import type { INotificationService } from '../interfaces/services/INotificationService';

const router = Router();
const notificationService = container.get<INotificationService>(TYPES.INotificationService);
const notificationController = new NotificationController(notificationService);

// Bind controller to preserve 'this' context
router.get(
  '/', 
  AuthMiddleware.verifyToken,
  (req, res, next) => notificationController.getNotifications(req, res, next)
);

router.patch(
  '/:id/read', 
  AuthMiddleware.verifyToken,
  (req, res, next) => notificationController.markAsRead(req, res, next)
);

export default router;
