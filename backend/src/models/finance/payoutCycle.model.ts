import mongoose, { Schema } from 'mongoose';
import type { IPayoutCycle } from '../../interfaces/models/compensation.interface.js';

const payoutCycleSchema = new Schema<IPayoutCycle>(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['draft', 'calculated', 'approved', 'paid'], 
      default: 'draft',
      required: true 
    },
    totalAmount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR', required: true },
    mentorEarnings: [{ type: Schema.Types.ObjectId, ref: 'MentorEarning' }],
    processedAt: Date,
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true, collection: 'payout_cycles' }
);

// Indexes
payoutCycleSchema.index({ startDate: 1, endDate: 1 });
payoutCycleSchema.index({ status: 1 });

export const PayoutCycleModel = mongoose.model<IPayoutCycle>(
  'PayoutCycle',
  payoutCycleSchema
);
