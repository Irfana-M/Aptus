import { Schema, Document } from 'mongoose';

export type NotificationType = 
  | 'session_booked' 
  | 'reminder_24h' 
  | 'reminder_1h' 
  | 'session_starting' 
  | 'session_cancelled' 
  | 'session_rescheduled'
  | 'preferences_saved'
  | 'preferences_admin_notify'
  | 'preferences_mentor_notify'
  | 'preferences_submitted'
  | 'mentor_request_submitted'
  | 'mentor_request_pending'
  | 'mentor_assigned'
  | 'mentor_request_rejected'
  | 'mentor_reassigned'
  | 'subscription_activated';

export type NotificationChannel = 'email' | 'web' | 'push';

export interface INotification extends Document {
  userId: Schema.Types.ObjectId;
  userRole: 'student' | 'mentor' | 'admin';
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  message: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
  sentAt?: Date;
  metadata?: Record<string, any>;
}
