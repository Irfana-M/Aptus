import { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  studentId: Schema.Types.ObjectId;
  studentSubjectId: Schema.Types.ObjectId;
  timeSlotId: Schema.Types.ObjectId;
  status: 'scheduled' | 'completed' | 'cancelled' | 'absent';
  cost?: number; 
  currency?: string; 
  createdAt: Date;
  updatedAt: Date;
}
