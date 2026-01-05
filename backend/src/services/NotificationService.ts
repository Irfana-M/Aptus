import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { INotificationRepository } from '../interfaces/repositories/INotificationRepository';
import type { INotificationService } from '../interfaces/services/INotificationService';
import type { IEmailService } from '../interfaces/services/IEmailService';
import type { ISocketService } from '../interfaces/services/ISocketService';
import type { INotification, NotificationType, NotificationChannel } from '../interfaces/models/notification.interface';
import { logger } from '../utils/logger';

@injectable()
export class NotificationService implements INotificationService {
  constructor(
    @inject(TYPES.INotificationRepository) private _notificationRepo: INotificationRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
    @inject(TYPES.ISocketService) private _socketService: ISocketService
  ) {}

  async notifyUser(
    userId: string, 
    userRole: 'student' | 'mentor' | 'admin', 
    type: NotificationType, 
    payload: any,
    channels: NotificationChannel[] = ['web']
  ): Promise<void> {
    const { title, message } = this._applyTemplate(type, payload);

    await this._notificationRepo.create({
      userId: userId as any,
      userRole,
      type,
      channels,
      title,
      message,
      payload,
      status: 'pending'
    });

    // Strategy: Immediate delivery for critical types (session_starting, cancellation)
    if (type === 'session_starting' || type === 'session_cancelled') {
        await this.processQueue();
    }
  }

  async processQueue(): Promise<void> {
    const pending = await this._notificationRepo.findPendingNotifications();
    logger.info(`Processing ${pending.length} pending notifications...`);

    for (const notification of pending) {
        try {
            for (const channel of notification.channels) {
                if (channel === 'email') await this._deliverEmail(notification);
                if (channel === 'web') await this._deliverWeb(notification);
            }
            await this._notificationRepo.updateStatus((notification._id as any).toString(), 'sent');
        } catch (error: any) {
            logger.error(`Failed to deliver notification ${notification._id}:`, error);
            await this._notificationRepo.updateStatus((notification._id as any).toString(), 'failed', error.message);
        }
    }
  }

  private _applyTemplate(type: NotificationType, payload: any): { title: string, message: string } {
    const templates: Record<NotificationType, { title: string, message: string }> = {
      session_booked: {
        title: "Session Booked Successfully",
        message: `Your session for ${payload.subjectName} is scheduled for ${payload.startTime}.`
      },
      reminder_24h: {
        title: "Reminder: Session Tomorrow",
        message: `Don't forget your session for ${payload.subjectName} tomorrow at ${payload.startTime}.`
      },
      reminder_1h: {
        title: "Reminder: Session in 1 Hour",
        message: `Your session for ${payload.subjectName} starts in 1 hour.`
      },
      session_starting: {
        title: "Session Starting Now!",
        message: `Your session for ${payload.subjectName} is starting. Join here: ${payload.joinLink}`
      },
      session_cancelled: {
        title: "Session Cancelled",
        message: `Your session for ${payload.subjectName} has been cancelled.`
      },
      session_rescheduled: {
        title: "Session Rescheduled",
        message: `Your session for ${payload.subjectName} has been moved to ${payload.startTime}.`
      },
      preferences_saved: {
        title: "Preferences Saved",
        message: "Your learning preferences have been saved successfully. We are now matching you with the best mentor."
      },
      preferences_admin_notify: {
        title: "New Student Preferences",
        message: `Student ${payload.studentName} has submitted preferences for ${payload.subjectCount} subjects. Assignment pending.`
      },
      preferences_mentor_notify: {
        title: "New Availability Received",
        message: `A student has expressed interest in ${payload.subjectName}. Check if your availability matches.`
      },
      preferences_submitted: {
        title: "Preferences Submitted",
        message: "Preferences submitted successfully."
      },
      mentor_request_submitted: {
        title: "Mentor Request Submitted",
        message: "Your mentor request has been submitted."
      },
      mentor_request_pending: {
        title: "Mentor Request Pending",
        message: "Your mentor request is pending approval."
      },
      mentor_assigned: {
        title: "Mentor Assigned",
        message: "A mentor has been assigned to you."
      },
      mentor_request_rejected: {
        title: "Mentor Request Rejected",
        message: "Your mentor request was rejected."
      },
      mentor_reassigned: {
        title: "Mentor Reassigned",
        message: "A new mentor has been reassigned to you."
      },
      subscription_activated: {
        title: "Subscription Activated!",
        message: `Your ${payload.plan} subscription is now active. You can start booking sessions.`
      }
    };

    return templates[type] || { title: "Notification", message: "You have a new message from Aptus." };
  }

  async createNotification(
    userId: string | any,
    userRole: 'student' | 'mentor' | 'admin',
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any
  ): Promise<INotification> {
    return this._notificationRepo.create({
      userId,
      userRole,
      type,
      title,
      message,
      payload: metadata || {},
      channels: ['web'], // Default
      status: 'pending'
    });
  }

  private async _deliverEmail(notification: INotification): Promise<void> {
    // STUB: Email notifications disabled for this iteration.
    // In a real app, we'd fetch the user's email here if it's not in the payload
    // const email = (notification.payload?.email as string) || 'user@example.com'; 
    // await this._emailService.sendMail(email, notification.title, `<p>${notification.message}</p>`);
    logger.info(`[NotificationService] Email delivery skipped (Stubbed) for notification ${notification._id} - ${notification.title}`);
    return Promise.resolve();
  }

  private async _deliverWeb(notification: INotification): Promise<void> {
    // Socket emit to specific user
    // We assume SocketService has a way to broadcast to a room defined by userId
    this._socketService.emitToRoom(`user-${notification.userId.toString()}`, 'notification', {
        title: notification.title,
        message: notification.message,
        payload: notification.payload
    });
  }
  async notifyPreferencesSubmitted(
    studentId: string | any,
    studentName: string,
    subjectName: string,
    adminId: string | any
  ): Promise<void> {
    await this._notificationRepo.create({
      userId: adminId,
      userRole: 'admin',
      type: 'preferences_submitted',
      title: 'New Preference Submission',
      message: `${studentName} submitted preferences for ${subjectName}`,
      payload: { studentId, subjectName },
      channels: ['web'],
      status: 'pending'
    });
    this.processQueue();
  }

  async notifyMentorRequestSubmitted(
    studentId: string | any,
    studentName: string,
    mentorName: string,
    subjectName: string,
    adminId: string | any
  ): Promise<void> {
    // Notify admin
    await this._notificationRepo.create({
      userId: adminId,
      userRole: 'admin',
      type: 'mentor_request_submitted',
      title: 'New Mentor Request',
      message: `${studentName} requested ${mentorName} for ${subjectName}`,
      payload: { studentId, mentorName, subjectName },
      channels: ['web'],
      status: 'pending'
    });

    // Notify student
    await this._notificationRepo.create({
      userId: studentId,
      userRole: 'student',
      type: 'mentor_request_pending',
      title: 'Mentor Request Submitted',
      message: `Your request for ${mentorName} (${subjectName}) is pending admin approval`,
      payload: { mentorName, subjectName },
      channels: ['web'],
      status: 'pending'
    });
    this.processQueue();
  }

  async notifyMentorAssigned(
    studentId: string | any,
    studentName: string,
    mentorId: string | any,
    mentorName: string,
    subjectName: string
  ): Promise<void> {
    // Notify student
    await this._notificationRepo.create({
      userId: studentId,
      userRole: 'student',
      type: 'mentor_assigned',
      title: 'Mentor Assigned!',
      message: `${mentorName} has been assigned as your mentor for ${subjectName}`,
      payload: { mentorId, mentorName, subjectName },
      channels: ['web'],
      status: 'pending'
    });

    // Notify mentor
    await this._notificationRepo.create({
      userId: mentorId,
      userRole: 'mentor',
      type: 'mentor_assigned',
      title: 'New Student Assigned',
      message: `${studentName} has been assigned to you for ${subjectName}`,
      payload: { studentId, studentName, subjectName },
      channels: ['web'],
      status: 'pending'
    });
    this.processQueue();
  }

  async notifyMentorRequestRejected(
    studentId: string | any,
    mentorName: string,
    subjectName: string,
    reason?: string
  ): Promise<void> {
    await this._notificationRepo.create({
      userId: studentId,
      userRole: 'student', 
      type: 'mentor_request_rejected',
      title: 'Mentor Request Not Approved',
      message: `Your request for ${mentorName} (${subjectName}) was not approved${reason ? `: ${reason}` : ''}`,
      payload: { mentorName, subjectName, reason },
      channels: ['web'],
      status: 'pending'
    });
    this.processQueue();
  }

  async getUserNotifications(userId: string, role: string): Promise<any[]> {
    return this._notificationRepo.findByUser(userId, role);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this._notificationRepo.markAsRead(notificationId);
  }
}
