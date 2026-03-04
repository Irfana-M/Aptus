import type { Request, Response, NextFunction } from 'express';
import type { INotificationService } from '../interfaces/services/INotificationService.js';
import { HttpStatusCode } from '../constants/httpStatus.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.constants.js';

export class NotificationController {
  constructor(
    private _notificationService: INotificationService
  ) {}

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);

      const notifications = await this._notificationService.getUserNotifications(user.id, user.role);
      const mappedNotifications = notifications.map(n => ({
        
        ...(n as any)._doc || n,
        isRead: n.status === 'read'
      }));

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: mappedNotifications
      });
    } catch (error) {
        next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (!id) {
            throw new AppError(MESSAGES.COMMON.ID_REQUIRED('Notification'), HttpStatusCode.BAD_REQUEST);
        }
        await this._notificationService.markAsRead(id);
        res.status(HttpStatusCode.OK).json({
            success: true,
            message: MESSAGES.NOTIFICATION.MARK_READ_SUCCESS
        });
    } catch (error) {
        next(error);
    }
  }
}
