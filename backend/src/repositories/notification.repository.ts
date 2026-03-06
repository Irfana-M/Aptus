import { injectable } from 'inversify';
import type { ClientSession } from 'mongoose';
import { BaseRepository } from './baseRepository.js';
import type { INotificationRepository } from '../interfaces/repositories/INotificationRepository.js';
import type { INotification } from '../interfaces/models/notification.interface.js';
import { NotificationModel } from '../models/notification.model.js';

@injectable()
export class NotificationRepository extends BaseRepository<INotification> implements INotificationRepository {
  constructor() {
    super(NotificationModel);
  }

  async findPendingNotifications(session?: ClientSession): Promise<INotification[]> {
    return await this.model.find({ status: 'pending' }).session(session || null).exec() as unknown as INotification[];
  }

  async updateStatus(notificationId: string, status: 'sent' | 'failed' | 'read', error?: string, session?: ClientSession): Promise<void> {
    const update: Record<string, unknown> = { status };
    if (status === 'sent') update.sentAt = new Date();
    if (status === 'read') update.isRead = true;
    if (error) update.error = error;
    
    await this.model.findByIdAndUpdate(notificationId, update, { session: session || null }).exec();
  }

  async findByUser(userId: string, role: string): Promise<INotification[]> {
    return this.model.find({ userId, userRole: role })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec() as unknown as INotification[];
  }

  async findByUserPaginated(userId: string, role: string, page: number, limit: number): Promise<{ items: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find({ userId, userRole: role })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec() as unknown as INotification[],
      this.model.countDocuments({ userId, userRole: role })
    ]);
    return { items, total };
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.model.findByIdAndUpdate(notificationId, { status: 'read', isRead: true }).exec();
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.model.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, status: 'read' } }
    ).exec();
    return result.modifiedCount;
  }
}
