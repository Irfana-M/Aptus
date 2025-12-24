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
    grade: {
      type: String,
      required: true,
    },
    mentoringMode: {
      type: String,
      enum: ["one-to-one", "one-to-many"],
      required: true,
    },
    preferredDays: [{
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    }],
    timeSlot: {
      type: String, // "17:00-18:00"
      required: true,
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
