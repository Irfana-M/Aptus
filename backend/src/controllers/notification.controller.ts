import type { Request, Response, NextFunction } from 'express';
import type { INotificationService } from '../interfaces/services/INotificationService';
import { HttpStatusCode } from '../constants/httpStatus';
import { AppError } from '../utils/AppError';

export class NotificationController {
  constructor(
    private _notificationService: INotificationService
  ) {}

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) throw new AppError('Unauthorized', HttpStatusCode.UNAUTHORIZED);

      const notifications = await this._notificationService.getUserNotifications(user.id, user.role);
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: notifications
      });
    } catch (error) {
        next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
        const { id } = req.params;
        if (!id) {
            throw new AppError('Notification ID is required', HttpStatusCode.BAD_REQUEST);
        }
        await this._notificationService.markAsRead(id);
        res.status(HttpStatusCode.OK).json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        next(error);
    }
  }
}
