import mongoose, { Schema, Document } from "mongoose";
import type { ICourseRequest } from "../interfaces/models/courseRequest.interface";

export interface CourseRequestDocument extends ICourseRequest, Document {}

const CourseRequestSchema: Schema = new Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mentor",
      required: false,
    },
    subject: {
      type: String,
      required: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },
    grade: {
      type: String,
      required: true,
    },
    gradeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Grade",
      required: false,
    },
    syllabus: {
      type: String,
      required: false,
    },
    mentoringMode: {
      type: String,
      enum: ["one-to-one", "group"],
      required: true,
    },
    preferredDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    }],
    timeSlot: {
      type: String, // "17:00-18:00"
      required: false,
    },
    timezone: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "fulfilled", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export const CourseRequestModel = mongoose.model<CourseRequestDocument>(
  "CourseRequest",
  CourseRequestSchema
);
