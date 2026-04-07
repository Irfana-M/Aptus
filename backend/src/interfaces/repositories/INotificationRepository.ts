import type { ClientSession } from 'mongoose';
import type { IBaseRepository } from './IBaseRepository';
import type { INotification } from '../models/notification.interface';

export interface INotificationRepository extends IBaseRepository<INotification> {
  findPendingNotifications(session?: ClientSession): Promise<INotification[]>;
  updateStatus(notificationId: string, status: 'sent' | 'failed' | 'read', error?: string, session?: ClientSession): Promise<void>;
  findByUser(userId: string, role: string): Promise<INotification[]>;
  findByUserPaginated(userId: string, role: string, page: number, limit: number): Promise<{ items: INotification[]; total: number }>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<number>;
}
