import mongoose, { Schema } from 'mongoose';
import type { IAttendance } from '../../interfaces/models/attendance.interface';

const attendanceSchema = new Schema<IAttendance>(
  {
    sessionId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Session', 
      required: true 
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      required: true 
    },
    userRole: { 
      type: String, 
      enum: ['student', 'mentor'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'late', 'excused', 'half-day'], 
      default: 'absent',
      required: true 
    },
    durationMinutes: { type: Number, default: 0 },
    percentageAttended: { type: Number, default: 0 },
    isLate: { type: Boolean, default: false },
    leftEarly: { type: Boolean, default: false },
    metadata: {
      firstJoinedAt: Date,
      lastLeftAt: Date,
      totalStays: { type: Number, default: 0 }
    },
    isFinalized: { type: Boolean, default: false },
    auditedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true, collection: 'attendance_records' }
);

// Indexes
attendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });
attendanceSchema.index({ userId: 1, status: 1 });
attendanceSchema.index({ createdAt: 1 }); // For date-range reports

export const AttendanceModel = mongoose.model<IAttendance>(
  'Attendance',
  attendanceSchema
);
