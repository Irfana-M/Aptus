import mongoose, { Schema } from 'mongoose';
import type { IBooking } from '../../interfaces/models/booking.interface.js';
import { BOOKING_STATUS } from '../../constants/status.constants.js';

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
      enum: Object.values(BOOKING_STATUS), 
      default: BOOKING_STATUS.SCHEDULED,
      required: true 
    },
    cost: { type: Number },
    currency: { type: String },
    rebookingRequired: { type: Boolean, default: false },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session' },
    rebookMentorId: { type: Schema.Types.ObjectId, ref: 'Mentor' },
  },
  { timestamps: true }
);

// Indexes
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ studentSubjectId: 1, status: 1 });
bookingSchema.index({ timeSlotId: 1 }); 
bookingSchema.index({ sessionId: 1 }); 
bookingSchema.index({ studentId: 1, timeSlotId: 1 }, { unique: true }); // A student can only book a slot once

export const BookingModel = mongoose.model<IBooking>(
  'Booking',
  bookingSchema
);
