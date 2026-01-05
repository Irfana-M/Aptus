import { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  sessionId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId; 
  userRole: 'student' | 'mentor';
  
  status: 'present' | 'absent' | 'late' | 'excused' | 'half-day';
  
  durationMinutes: number;
  percentageAttended: number;
  
  isLate: boolean;
  leftEarly: boolean;
  
  metadata: {
    firstJoinedAt?: Date;
    lastLeftAt?: Date;
    totalStays: number; 
  };
  
  isFinalized: boolean; 
  auditedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
