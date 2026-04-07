import mongoose, { Schema } from 'mongoose';
import type { ITimeSlot } from '../../interfaces/models/timeSlot.interface';

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    mentorId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Mentor', 
      required: true 
    },
    subjectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Subject', 
      required: true 
    },
    startTime: { 
      type: Date, 
      required: true 
    },
    endTime: { 
      type: Date, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['available', 'reserved', 'booked', 'cancelled'], 
      default: 'available',
      required: true 
    },
    maxStudents: {
      type: Number,
      default: 1,
      required: true
    },
    currentStudentCount: {
      type: Number,
      default: 0,
      required: true
    }
  },
  { timestamps: true, collection: 'time_slots' }
);

// Indexes for performance and conflict prevention
timeSlotSchema.index({ mentorId: 1, startTime: 1 }, { unique: true });
timeSlotSchema.index({ subjectId: 1, startTime: 1, status: 1 }); // Optimized for student slot search
timeSlotSchema.index({ status: 1 });

export const TimeSlotModel = mongoose.model<ITimeSlot>(
  'TimeSlot',
  timeSlotSchema
);
