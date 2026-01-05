import mongoose, { Schema } from 'mongoose';
import type { INotification } from '../interfaces/models/notification.interface';

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, required: true, refPath: 'userRole' },
  userRole: { type: String, enum: ['student', 'mentor', 'admin'], required: true },
  type: { 
    type: String, 
    enum: [
      'session_booked', 
      'reminder_24h', 
      'reminder_1h', 
      'session_starting', 
      'session_cancelled', 
      'session_rescheduled',
      'preferences_submitted',
      'mentor_request_submitted',
      'mentor_request_pending',
      'mentor_assigned',
      'mentor_request_rejected',
      'mentor_reassigned'
    ], 
    required: true 
  },
  channels: [{ type: String, enum: ['email', 'web', 'push'], default: ['email', 'web'] }],
  title: { type: String, required: true },
  message: { type: String, required: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['pending', 'sent', 'failed', 'read'], default: 'pending' },
  error: { type: String },
  sentAt: { type: Date },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

NotificationSchema.index({ userId: 1, status: 1 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // Auto-delete after 30 days

export const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);
