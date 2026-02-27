import { Schema, Document } from "mongoose";


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

 
  status: 'scheduled' | 'in_progress' | 'completed' | 'not_held' | 'cancelled' | 'rescheduling';

  
  startTime: Date;
  endTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;

  
  webRTCId?: string;
  recordingUrl?: string;

  mentorNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}
