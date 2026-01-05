import mongoose, { Schema } from 'mongoose';
import type { IMentorAvailability } from '../../interfaces/models/mentorAvailability.interface';

const recurringSlotSchema = new Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
}, { _id: false });

const mentorAvailabilitySchema = new Schema<IMentorAvailability>(
  {
    mentorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Mentor', 
      required: true 
    },
    dayOfWeek: { 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true 
    },
    slots: [recurringSlotSchema],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    effectiveFrom: { 
      type: Date, 
      default: Date.now 
    },
  },
  { timestamps: true }
);

// Ensure a mentor can't have duplicate availability entries for the same day
mentorAvailabilitySchema.index({ mentorId: 1, dayOfWeek: 1 }, { unique: true });

export const MentorAvailabilityModel = mongoose.model<IMentorAvailability>(
  'MentorAvailability',
  mentorAvailabilitySchema
);
