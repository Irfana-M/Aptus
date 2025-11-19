import { Schema, model, Document } from "mongoose";

export interface ISubject extends Document {
  subjectName: string;  
  syllabus: "CBSE" | "STATE" | "ICSE";
  grade: number;
  isActive?: boolean;  
}

const SubjectSchema = new Schema<ISubject>(
  {
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    syllabus: {
      type: String,
      enum: ["CBSE", "STATE", "ICSE"],
      required: true,
    },
    grade: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    isActive: {
      type: Boolean,
      default: true  
    },
  },
  { timestamps: true }
);


SubjectSchema.index({ syllabus: 1, grade: 1, subjectName: 1 }, { unique: true });
SubjectSchema.index({ isActive: 1 });

export const Subject = model<ISubject>("Subject", SubjectSchema);