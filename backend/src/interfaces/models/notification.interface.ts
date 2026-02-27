import { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'session_booked'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'session_starting'
  | 'session_cancelled'
  | 'session_rescheduled'
  | 'mentor_absence_reschedule'
  | 'student_absence'
  | 'session_cancelled_refund'
  | 'preferences_submitted'
  | 'preferences_saved'
  | 'preferences_admin_notify'
  | 'preferences_mentor_notify'
  | 'mentor_request_submitted'
  | 'mentor_request_pending'
  | 'admin_course_request'
  | 'admin_trial_booked'
  | 'admin_subscription_activated'
  | 'admin_user_registered'
  | 'mentor_assignment_request'
  | 'course_created'
  | 'mentor_assigned'
  | 'mentor_request_rejected'
  | 'mentor_reassigned'
  | 'subscription_activated'
  | 'trial_completed'
  | 'trial_booked'
  | 'withdrawal_request_update'
  | 'assignment_created'
  | 'assignment_reminder'
  | 'assignment_submitted'
  | 'assignment_feedback';

export type NotificationChannel = 'email' | 'web' | 'push';

export interface INotification extends Document {
  userId: Schema.Types.ObjectId;
  userRole: 'student' | 'mentor' | 'admin';
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  message: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed' | 'read';
  error?: string;
  sentAt?: Date;
  isRead: boolean;
  metadata?: Record<string, unknown>;
}

