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
    subject: {
      type: String,
      required: true,
    },
    mentoringMode: {
      type: String,
      enum: ["one-to-one", "one-to-many"],
      required: true,
    },
    preferredDay: {
      type: String,
      required: true,
    },
    timeRange: {
      type: String,
      required: true,
    },
    timezone: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "fulfilled"],
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
