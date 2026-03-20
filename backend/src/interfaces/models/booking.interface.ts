import { Schema, Document } from "mongoose";
import { BOOKING_STATUS } from "../../constants/status.constants.js";

export interface IBooking extends Document {
  studentId: Schema.Types.ObjectId;
  studentSubjectId: Schema.Types.ObjectId;
  timeSlotId: Schema.Types.ObjectId;
  status: BOOKING_STATUS;
  subjectId?: Schema.Types.ObjectId;
  courseId?: Schema.Types.ObjectId;
  enrollmentId?: Schema.Types.ObjectId;
  isGroup?: boolean;
  cost?: number; 
  currency?: string; 
  rebookingRequired?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
