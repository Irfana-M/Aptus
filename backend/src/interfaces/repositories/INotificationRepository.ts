import type { ClientSession } from 'mongoose';
import type { IBaseRepository } from './IBaseRepository.js';
import type { INotification } from '../models/notification.interface.js';

export interface INotificationRepository extends IBaseRepository<INotification> {
  findPendingNotifications(session?: ClientSession): Promise<INotification[]>;
  updateStatus(notificationId: string, status: 'sent' | 'failed' | 'read', error?: string, session?: ClientSession): Promise<void>;
  findByUser(userId: string, role: string): Promise<INotification[]>;
  markAsRead(notificationId: string): Promise<void>;
}
