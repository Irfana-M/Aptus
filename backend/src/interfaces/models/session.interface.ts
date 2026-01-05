import { Schema, Document } from "mongoose";

/**
 * Unified participant model for attendance & chat
 */
export interface ISessionParticipant {
  userId: Schema.Types.ObjectId;
  role: 'student' | 'mentor';
  status?: 'scheduled' | 'present' | 'absent' | 'late' | 'left-early';
  joinedAt?: Date;
  leftAt?: Date;
}

/**
 * Session interface
 */
export interface ISession extends Document {
  // Core relations
  timeSlotId: Schema.Types.ObjectId;
  mentorId: Schema.Types.ObjectId;
  subjectId: Schema.Types.ObjectId;

  // NEW (optional for backward compatibility)
  studentId?: Schema.Types.ObjectId;
  courseId?: Schema.Types.ObjectId;
  enrollmentId?: Schema.Types.ObjectId;
  trialClassId?: Schema.Types.ObjectId;

  sessionType: 'group' | 'one-to-one';

  // Attendance & chat
  participants: ISessionParticipant[];

  // Mentor attendance (kept for compatibility)
  mentorStatus?: 'scheduled' | 'present' | 'absent' | 'late';

  // Session lifecycle
  status: 'scheduled' | 'in_progress' | 'completed' | 'not_held' | 'cancelled';

  // Timing
  startTime: Date;
  endTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;

  // Communication
  webRTCId?: string;
  recordingUrl?: string;

  mentorNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}
