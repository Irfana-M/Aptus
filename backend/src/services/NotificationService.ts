import { injectable, inject } from 'inversify';
import { Types, Schema } from 'mongoose';
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
  ) { }

  async notifyUser(
    userId: string,
    userRole: 'student' | 'mentor' | 'admin',
    type: NotificationType,
    payload: Record<string, unknown>,
    channels: NotificationChannel[] = ['web']
  ): Promise<void> {
    const { title, message } = this._applyTemplate(type, payload);

    await this._notificationRepo.create({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
      userRole,
      type,
      channels,
      title,
      message,
      payload: payload as Record<string, unknown>,
      status: 'pending'
    });

    // Strategy: Immediate delivery for critical types (session_starting, cancellation, assignment)
    if (['session_starting', 'session_cancelled', 'mentor_assigned', 'mentor_reassigned', 'session_rescheduled', 'session_booked', 'student_absence', 'mentor_absence_reschedule', 'session_cancelled_refund'].includes(type)) {
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
        await this._notificationRepo.updateStatus((notification._id as { toString(): string }).toString(), 'sent');
      } catch (error) {
        const err = error as { message?: string };
        logger.error(`Failed to deliver notification ${notification._id}:`, error);
        await this._notificationRepo.updateStatus((notification._id as { toString(): string }).toString(), 'failed', err.message);
      }
    }
  }

  private _applyTemplate(type: NotificationType, payload: Record<string, unknown>): { title: string, message: string } {
    const p = payload as Record<string, string>;
    const templates: Record<NotificationType, { title: string, message: string }> = {
      session_booked: {
        title: "Session Booked Successfully",
        message: `Your session for ${p.subjectName} is scheduled for ${p.startTime}.`
      },
      reminder_24h: {
        title: "Reminder: Session Tomorrow",
        message: `Don't forget your session for ${p.subjectName} tomorrow at ${p.startTime}.`
      },
      reminder_1h: {
        title: "Reminder: Session in 1 Hour",
        message: `Your session for ${p.subjectName} starts in 1 hour.`
      },
      session_starting: {
        title: "Session Starting Now!",
        message: `Your session for ${p.subjectName} is starting.`,
      },
      session_cancelled: {
        title: "Session Cancelled",
        message: `Your session for ${p.subjectName} has been cancelled.`
      },
      session_rescheduled: {
        title: "Session Rescheduled",
        message: `Your session for ${p.subjectName} has been moved to ${p.startTime}.`
      },
      preferences_saved: {
        title: "Preferences Saved",
        message: "Your learning preferences have been saved successfully. We are now matching you with the best mentor."
      },
      preferences_admin_notify: {
        title: "New Student Preferences",
        message: `Student ${p.studentName} has submitted preferences for ${p.subjectCount} subjects. Assignment pending.`
      },
      preferences_mentor_notify: {
        title: "New Availability Received",
        message: `A student has expressed interest in ${p.subjectName}. Check if your availability matches.`
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
        message: `Your ${p.plan} subscription is now active. You can start booking sessions.`
      },
      trial_completed: {
        title: "Trial Class Completed",
        message: `Congratulations on completing your ${p.subjectName} trial class! Please share your feedback.`
      },
      trial_booked: {
        title: "Trial Class Booked!",
        message: `Your free trial class for ${p.subjectName || 'your selected subject'} has been booked for ${p.preferredDate || 'the selected date'} at ${p.preferredTime || 'the selected time'}. A mentor will be assigned shortly.`
      },
      student_absence: {
        title: "Student Absence Reported",
        message: p.message || "A student has reported absence."
      },
      mentor_absence_reschedule: {
        title: "Mentor Absence - Reschedule Needed",
        message: p.message || "Your mentor is absent. Please reschedule."
      },
      session_cancelled_refund: {
        title: "Session Cancelled & Refunded",
        message: p.message || "Session cancelled and refund processed."
      },
      withdrawal_request_update: {
        title: "Withdrawal Request Updated",
        message: p.message || "Your withdrawal request status has been updated."
      },
      assignment_created: {
        title: "New Assignment",
        message: `New assignment: "${p.title}" - Due: ${p.dueDate}. Download the assignment file and submit your work before the deadline.`
      },
      assignment_reminder: {
        title: "Assignment Due Soon",
        message: `Reminder: "${p.title}" is due in ${p.hoursRemaining} hours. Submit your work soon!`
      },
      assignment_submitted: {
        title: "Assignment Submitted",
        message: `${p.studentName} has submitted "${p.title}".`
      },
      assignment_feedback: {
        title: "Assignment Feedback Received",
        message: `Your mentor has reviewed your assignment "${p.title}". Check your feedback now!`
      },
      admin_course_request: {
        title: "New Course Request",
        message: `A new course request has been submitted.`
      },

      mentor_assignment_request: {
        title: "Mentor Assignment Request",
        message: `You have received a new mentor assignment request.`
      },

      course_created: {
        title: "Course Created Successfully",
        message: `The course has been created successfully.`
      },
      admin_subscription_activated: {
        title: "New Student Subscription",
        message: `Student ${p.studentName} has activated a ${p.plan} subscription.`
      },
      admin_trial_booked: {
        title: "New Trial Class Request",
        message: `Student ${p.studentName} has requested a trial class for ${p.subjectName}.`
      },
      admin_user_registered: {
        title: "New User Registered",
        message: `A new ${p.role} has registered: ${p.email} (${p.fullName})`
      },
    };

    return templates[type] || { title: "Notification", message: "You have a new message from Aptus." };
  }

  async createNotification(
    userId: string,
    userRole: 'student' | 'mentor' | 'admin',
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<INotification> {
    return this._notificationRepo.create({
      userId: new Types.ObjectId(userId) as unknown as Schema.Types.ObjectId,
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
    studentId: string,
    studentName: string,
    subjectName: string,
    adminId: string
  ): Promise<void> {
    await this._notificationRepo.create({
      userId: new Types.ObjectId(adminId) as unknown as Schema.Types.ObjectId,
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
    studentId: string,
    studentName: string,
    mentorName: string,
    subjectName: string,
    adminId: string
  ): Promise<void> {
    // Notify admin
    await this._notificationRepo.create({
      userId: new Types.ObjectId(adminId) as unknown as Schema.Types.ObjectId,
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
      userId: new Types.ObjectId(studentId) as unknown as Schema.Types.ObjectId,
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
    studentId: string,
    studentName: string,
    mentorId: string,
    mentorName: string,
    subjectName: string
  ): Promise<void> {
    // Notify student
    await this._notificationRepo.create({
      userId: new Types.ObjectId(studentId) as unknown as Schema.Types.ObjectId,
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
      userId: new Types.ObjectId(mentorId) as unknown as Schema.Types.ObjectId,
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
    studentId: string,
    mentorName: string,
    subjectName: string,
    reason?: string
  ): Promise<void> {
    await this._notificationRepo.create({
      userId: new Types.ObjectId(studentId) as unknown as Schema.Types.ObjectId,
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

  async notifyTrialCompleted(
    studentId: string,
    studentName: string,
    subjectName: string
  ): Promise<void> {
    await this._notificationRepo.create({
      userId: new Types.ObjectId(studentId) as unknown as Schema.Types.ObjectId,
      userRole: 'student',
      type: 'trial_completed',
      title: 'Trial Class Completed',
      message: `Congratulations on completing your ${subjectName} trial class! Please share your feedback.`,
      payload: { studentId, subjectName },
      channels: ['web'],
      status: 'pending'
    });
    this.processQueue();
  }

  async getUserNotifications(userId: string, role: string): Promise<INotification[]> {
    return this._notificationRepo.findByUser(userId, role);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this._notificationRepo.markAsRead(notificationId);
  }
}
