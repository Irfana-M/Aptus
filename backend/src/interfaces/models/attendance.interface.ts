import { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  sessionId: Schema.Types.ObjectId;
  sessionModel: 'Session' | 'TrialClass';
  userId: Schema.Types.ObjectId; 
  userRole: 'Student' | 'Mentor';
  
  status: 'present' | 'absent';
  
  isFinalized: boolean; 
  source: 'manual' | 'trial_derived' | 'automated';
  auditedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
