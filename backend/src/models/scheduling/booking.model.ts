import mongoose, { Schema } from 'mongoose';
import type { IBooking } from '../../interfaces/models/booking.interface';

const bookingSchema = new Schema<IBooking>(
  {
    studentId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Student', 
      required: true 
    },
    studentSubjectId: { 
      type: Schema.Types.ObjectId, 
      ref: 'StudentSubject', 
      required: true 
    },
    timeSlotId: { 
      type: Schema.Types.ObjectId, 
      ref: 'TimeSlot', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['scheduled', 'completed', 'cancelled', 'absent'], 
      default: 'scheduled',
      required: true 
    },
  },
  { timestamps: true }
);

// Indexes
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ studentSubjectId: 1, status: 1 });
bookingSchema.index({ timeSlotId: 1 }); 
bookingSchema.index({ studentId: 1, timeSlotId: 1 }, { unique: true }); // A student can only book a slot once

export const BookingModel = mongoose.model<IBooking>(
  'Booking',
  bookingSchema
);
