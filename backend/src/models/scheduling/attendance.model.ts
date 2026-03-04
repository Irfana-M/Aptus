import mongoose, { Schema } from 'mongoose';
import type { IAttendance } from '../../interfaces/models/attendance.interface.js';

const attendanceSchema = new Schema<IAttendance>(
  {
    sessionId: { 
      type: Schema.Types.ObjectId, 
      required: true,
      refPath: 'sessionModel'
    },
    sessionModel: {
      type: String,
      required: true,
      enum: ['Session', 'TrialClass'],
      default: 'Session'
    },
    userId: { 
      type: Schema.Types.ObjectId, 
      refPath: 'userRole',
      required: true 
    },
    userRole: { 
      type: String, 
      enum: ['Student', 'Mentor'], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['present', 'absent'], 
      default: 'absent',
      required: true 
    },
    isFinalized: { type: Boolean, default: false },
    source: {
      type: String,
      enum: ['manual', 'trial_derived', 'automated'],
      default: 'manual',
      required: true
    },
    auditedBy: { type: Schema.Types.ObjectId, ref: 'Admin' }
  },
  { timestamps: true, collection: 'attendance_records' }
);

// Indexes
attendanceSchema.index({ sessionId: 1, userId: 1, sessionModel: 1 }, { unique: true });
attendanceSchema.index({ userId: 1, status: 1 });
attendanceSchema.index({ createdAt: 1 }); // For date-range reports

export const AttendanceModel = mongoose.model<IAttendance>(
  'Attendance',
  attendanceSchema
);
