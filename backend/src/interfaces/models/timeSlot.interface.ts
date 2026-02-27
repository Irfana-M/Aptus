import { Schema, Document } from "mongoose";

export interface ITimeSlot extends Document {
  mentorId: Schema.Types.ObjectId;
  subjectId?: Schema.Types.ObjectId; 
  startTime: Date;
  endTime: Date;
  status: 'available' | 'reserved' | 'booked' | 'cancelled';
  maxStudents: number;
  currentStudentCount: number;
  createdAt: Date;
  updatedAt: Date;
}
