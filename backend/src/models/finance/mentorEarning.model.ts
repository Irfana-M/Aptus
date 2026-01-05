import mongoose, { Schema } from 'mongoose';
import type { IMentorEarning } from '../../interfaces/models/compensation.interface';

const mentorEarningSchema = new Schema<IMentorEarning>(
  {
    sessionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Session', 
      required: true,
      unique: true // One earning per session
    },
    attendanceId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Attendance', 
      required: true 
    },
    mentorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Mentor', 
      required: true 
    },
    amount: { type: Number, required: true },
    baseRateUsed: { type: Number, required: true },
    currency: { type: String, required: true },
    payoutStatus: { 
      type: String, 
      enum: ['pending', 'in_cycle', 'paid'], 
      default: 'pending',
      required: true 
    },
    payoutCycleId: { type: Schema.Types.ObjectId, ref: 'PayoutCycle' },
    calculatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true, collection: 'mentor_earnings' }
);

// Indexes
mentorEarningSchema.index({ mentorId: 1, payoutStatus: 1 });
mentorEarningSchema.index({ payoutCycleId: 1 });

export const MentorEarningModel = mongoose.model<IMentorEarning>(
  'MentorEarning',
  mentorEarningSchema
);
