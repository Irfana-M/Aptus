import mongoose, { Schema } from 'mongoose';
import type { ISubscriptionPlan } from '../../interfaces/models/subscription.interface';

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    planCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    maxSubjects: { type: Number, required: true },
    sessionsPerSubjectPerWeek: { type: Number, required: true },
    totalSessionsPerWeek: { type: Number, required: true },
    maxStudentsAllowed: { type: Number, default: 10 },
    sessionType: { type: String, enum: ['GROUP', 'ONE_TO_ONE'], required: true },
    attendanceRequired: { type: Boolean, required: true },
    rescheduleAllowed: { type: Boolean, required: true },
    mentorChoice: { type: Boolean, required: true },
    hasStudyMaterials: { type: Boolean, default: true },
    hasExams: { type: Boolean, default: false },
    allowedDays: [{ 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    }],
    pricePerSession: { type: Number, required: true },
    currency: { type: String, default: 'INR', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
