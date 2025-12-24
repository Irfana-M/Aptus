import mongoose, { Schema, Document } from "mongoose";

export interface ICourse extends Document {
  grade: mongoose.Types.ObjectId;       
  subject: mongoose.Types.ObjectId;      
  mentor: mongoose.Types.ObjectId;       
  student?: mongoose.Types.ObjectId;    
  schedule: {
    days: string[];
    timeSlot: string;
  };                     
  startDate: Date;
  endDate: Date;
  totalSessions?: number;
  fee?: number;
  status: "available" | "booked" | "ongoing" | "completed" | "cancelled";
  isActive: boolean;
}

const CourseSchema = new Schema<ICourse>(
  {
    grade: { type: Schema.Types.ObjectId, ref: "Grade", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    mentor: { type: Schema.Types.ObjectId, ref: "Mentor", required: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", default: null },
    schedule: {
      days: [{ 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      }],
      timeSlot: { type: String } // "17:00-18:00"
    }, 
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalSessions: { type: Number },
    fee: { type: Number, required: false, default: 0 },
    status: {
      type: String,
      enum: ["available", "booked", "ongoing", "completed", "cancelled"],
      default: "available",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


CourseSchema.index({ status: 1 });
CourseSchema.index({ mentor: 1 });

export const Course = mongoose.model<ICourse>("Course", CourseSchema);