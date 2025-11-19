import { Schema, model, Document } from "mongoose";

export interface IGrade extends Document {
  name: string;
  syllabus: "CBSE" | "STATE" | "ICSE";
  grade: number;
  isActive?: boolean;
}

const GradeSchema = new Schema<IGrade>(
  {
    name: {
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

GradeSchema.index({ grade: 1, syllabus: 1 }, { unique: true });

export const Grade = model<IGrade>("Grade", GradeSchema);