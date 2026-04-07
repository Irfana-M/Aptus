import mongoose, { Schema } from 'mongoose';
import type { INotification } from '../interfaces/models/notification.interface';

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, required: true, refPath: 'userRole' },

  userRole: {
    type: String,
    enum: ['student', 'mentor', 'admin'],
    required: true
  },

  type: {
    type: String,
    enum: [
      'session_booked',
      'reminder_24h',
      'reminder_1h',
      'session_starting',
      'session_cancelled',
      'session_rescheduled',
      'mentor_absence_reschedule',
      'student_absence',
      'session_cancelled_refund',
      'preferences_submitted',
      'preferences_saved',
      'preferences_admin_notify',
      'preferences_mentor_notify',
      'mentor_request_submitted',
      'mentor_request_pending',
      'admin_course_request',
      'admin_trial_booked',
      'admin_subscription_activated',
      'admin_user_registered',
      'mentor_assignment_request',
      'course_created',
      'mentor_assigned',
      'mentor_request_rejected',
      'mentor_reassigned',
      'subscription_activated',
      'trial_completed',
      'trial_booked',
      'withdrawal_request_update',
      'assignment_created',
      'assignment_reminder',
      'assignment_submitted',
      'assignment_feedback'
    ],
    required: true
  },

  channels: [{
    type: String,
    enum: ['email', 'web', 'push'],
    default: ['email', 'web']
  }],

  title: { type: String, required: true },

  message: { type: String, required: true },

  payload: { type: Schema.Types.Mixed, default: {} },

  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'read'],
    default: 'pending'
  },

  error: { type: String },

  sentAt: { type: Date },
  
  isRead: { type: Boolean, default: false },

  metadata: { type: Schema.Types.Mixed, default: {} }

}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, status: 1 });

NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days
);

export const NotificationModel =
  mongoose.model<INotification>('Notification', NotificationSchema);

