import type { NotificationType, NotificationChannel, INotification } from '../models/notification.interface.js';

export interface INotificationService {
  notifyUser(
    userId: string, 
    userRole: 'student' | 'mentor' | 'admin', 
    type: NotificationType, 
    payload: Record<string, unknown>,
    channels?: NotificationChannel[]
  ): Promise<void>;
  
  processQueue(): Promise<void>;

  createNotification(
    userId: string,
    userRole: 'student' | 'mentor' | 'admin',
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Record<string, unknown>
  ): Promise<INotification>;

  notifyPreferencesSubmitted(
    studentId: string,
    studentName: string,
    subjectName: string,
    adminId: string
  ): Promise<void>;

  notifyMentorRequestSubmitted(
    studentId: string,
    studentName: string,
    mentorName: string,
    subjectName: string,
    adminId: string
  ): Promise<void>;

  notifyMentorAssigned(
    studentId: string,
    studentName: string,
    mentorId: string,
    mentorName: string,
    subjectName: string
  ): Promise<void>;

  notifyMentorRequestRejected(
    studentId: string,
    mentorName: string,
    subjectName: string,
    reason?: string
  ): Promise<void>;

  notifyTrialCompleted(
    studentId: string,
    studentName: string,
    subjectName: string
  ): Promise<void>;

  getUserNotifications(userId: string, role: string): Promise<INotification[]>;
  markAsRead(notificationId: string): Promise<void>;
}
