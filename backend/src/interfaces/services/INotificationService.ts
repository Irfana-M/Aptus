import type { NotificationType, NotificationChannel } from '../models/notification.interface';

export interface INotificationService {
  notifyUser(
    userId: string | any, 
    userRole: 'student' | 'mentor' | 'admin', 
    type: NotificationType, 
    payload: any,
    channels?: NotificationChannel[]
  ): Promise<void>;
  
  processQueue(): Promise<void>;

  createNotification(
    userId: string | any,
    userRole: 'student' | 'mentor' | 'admin',
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any
  ): Promise<any>;

  notifyPreferencesSubmitted(
    studentId: string | any,
    studentName: string,
    subjectName: string,
    adminId: string | any
  ): Promise<void>;

  notifyMentorRequestSubmitted(
    studentId: string | any,
    studentName: string,
    mentorName: string,
    subjectName: string,
    adminId: string | any
  ): Promise<void>;

  notifyMentorAssigned(
    studentId: string | any,
    studentName: string,
    mentorId: string | any,
    mentorName: string,
    subjectName: string
  ): Promise<void>;

  notifyMentorRequestRejected(
    studentId: string | any,
    mentorName: string,
    subjectName: string,
    reason?: string
  ): Promise<void>;

  getUserNotifications(userId: string, role: string): Promise<any[]>;
  markAsRead(notificationId: string): Promise<void>;
}
