import mongoose, { Schema } from 'mongoose';
import type { IStudentSubscription } from '../../interfaces/models/subscription.interface.js';

const studentSubscriptionSchema = new Schema<IStudentSubscription>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'cancelled', 'pending'], 
      default: 'active', 
      required: true 
    },
    usage: {
      enrolledSubjects: [{
        subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
        enrolledAt: { type: Date, default: Date.now }
      }],
      weeklySessionUsage: {
        type: Map,
        of: Number,
        default: {}
      },
      totalWeeklyUsage: { type: Number, default: 0 },
      currentWeekStartDate: { type: Date, required: true }
    }
  },
  { timestamps: true }
);

// Index to quickly find active subscriptions for a student
studentSubscriptionSchema.index({ studentId: 1, status: 1 });

export const StudentSubscriptionModel = mongoose.model<IStudentSubscription>(
  'StudentSubscription',
  studentSubscriptionSchema
);
