import mongoose, { Schema } from 'mongoose';
import type { ISubscriptionPlan } from '../../interfaces/models/subscription.interface';

const subscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ['monthly', 'yearly'], default: 'monthly', required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR', required: true },
    entitlements: {
      maxSubjects: { type: Number, required: true },
      sessionsPerSubjectPerWeek: { type: Number, required: true },
      totalSessionsPerWeek: { type: Number, required: true }, // New: Global limit
      canChooseMentorSlot: { type: Boolean, default: false },
      allowedSessionTypes: [{ type: String, enum: ['group', 'one-to-one'] }] // New: Hybrid support
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SubscriptionPlanModel = mongoose.model<ISubscriptionPlan>(
  'SubscriptionPlan',
  subscriptionPlanSchema
);
