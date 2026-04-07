import type { Request, Response, NextFunction } from 'express';
import type { INotificationService } from '../interfaces/services/INotificationService';
import { HttpStatusCode } from '../constants/httpStatus';
import { AppError } from '../utils/AppError';
import { MESSAGES } from '../constants/messages.constants';
import { getPaginationParams, formatStandardizedPaginatedResult } from '../utils/pagination.util';

export class NotificationController {
  constructor(
    private _notificationService: INotificationService
  ) {}

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      if (!user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);

      const { page, limit } = getPaginationParams(req.query as Record<string, unknown>);
      const { items, total } = await this._notificationService.getUserNotificationsPaginated(user.id, user.role, page, limit);

      const mappedItems = items.map(n => ({
        ...(n as any)._doc || n,
        isRead: n.status === 'read'
      }));

      res.status(HttpStatusCode.OK).json(
        formatStandardizedPaginatedResult(mappedItems, total, { page, limit }, MESSAGES.COMMON.DATA_FETCHED)
      );
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

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
        const user = req.user;
        if (!user) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);

        const count = await this._notificationService.markAllAsRead(user.id);
        
        res.status(HttpStatusCode.OK).json({
            success: true,
            message: MESSAGES.NOTIFICATION.NOTIFICATIONS_MARKED_READ,
            data: { count }
        });
    } catch (error) {
        next(new AppError(MESSAGES.NOTIFICATION.NOTIFICATION_UPDATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR));
    }
  }
}
