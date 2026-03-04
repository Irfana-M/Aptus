import mongoose, { Schema } from 'mongoose';
import type { IMentorRate } from '../../interfaces/models/compensation.interface.js';

const mentorRateSchema = new Schema<IMentorRate>(
  {
    mentorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Mentor', 
      required: true,
      unique: true
    },
    defaultRate: { type: Number, required: true },
    currency: { type: String, default: 'INR', required: true },
    subjectRules: { 
      type: Map, 
      of: Number, 
      default: {} 
    },
    multipliers: {
      group: { type: Number, default: 1.0 },
      oneToOne: { type: Number, default: 1.0 }
    }
  },
  { timestamps: true, collection: 'mentor_rates' }
);

export const MentorRateModel = mongoose.model<IMentorRate>(
  'MentorRate',
  mentorRateSchema
);
