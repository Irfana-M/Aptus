import { Schema, Document } from "mongoose";

export interface IStudentSubject extends Document {
  studentId: Schema.Types.ObjectId;
  subjectId: Schema.Types.ObjectId;
  subscriptionId: Schema.Types.ObjectId;
  status: 'selected' | 'enrolled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
