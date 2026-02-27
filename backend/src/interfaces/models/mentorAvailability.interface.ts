import { Schema, Document } from "mongoose";

export interface IRecurringSlot {
  startTime: string; 
  endTime: string;   
}

export interface IMentorAvailability extends Document {
  mentorId: Schema.Types.ObjectId;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  slots: IRecurringSlot[];
  isActive: boolean;
  effectiveFrom?: Date;
  createdAt: Date;
  updatedAt: Date;
}
