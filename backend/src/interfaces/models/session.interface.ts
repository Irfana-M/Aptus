import { Schema, Document } from "mongoose";
import { SESSION_STATUS } from "../../constants/status.constants.js";

export interface ISessionParticipant {
  userId: Schema.Types.ObjectId;
  role: 'student' | 'mentor';
  status?: 'scheduled' | 'present' | 'absent' | 'cancelled';
}


export interface ISession extends Document {
  
  timeSlotId: Schema.Types.ObjectId;
  mentorId: Schema.Types.ObjectId;
  subjectId: Schema.Types.ObjectId;

  
  studentId?: Schema.Types.ObjectId;
  courseId?: Schema.Types.ObjectId;
  enrollmentId?: Schema.Types.ObjectId;
  trialClassId?: Schema.Types.ObjectId;

  sessionType: 'group' | 'one-to-one';


  participants: ISessionParticipant[];

  
  mentorStatus?: 'scheduled' | 'present' | 'absent';

 
  status: SESSION_STATUS;

  
  startTime: Date;
  endTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;

  
  webRTCId?: string;
  recordingUrl?: string;

  mentorNotes?: string;
  cancellationReason?: string | null;
  cancelledBy?: 'student' | 'mentor' | 'admin' | null;

  // New fields for Rescheduling and Leave
  isRescheduled?: boolean;
  rescheduledTo?: Schema.Types.ObjectId;
  leaveRequestedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
