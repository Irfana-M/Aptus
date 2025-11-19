import type { StudentAuthUser } from "@/interfaces/auth/auth.interface";
import type { ISubject } from "@/interfaces/models/subject.interface";
import type { MentorProfile } from "@/interfaces/models/user.interface";
import { Schema, model, Document } from "mongoose";

export interface ITrialClassDocument extends Document {
  student: Schema.Types.ObjectId |  StudentAuthUser;
  subject: Schema.Types.ObjectId | ISubject;
  mentor?: Schema.Types.ObjectId | MentorProfile;
  status: "requested" | "assigned" | "completed" | "cancelled";
  preferredDate: Date;
  preferredTime: string;
  scheduledDateTime?: Date;
  notes?: string;
  meetLink?: string;
  feedback?: {
    rating?: number;
    comment?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TrialClassSchema = new Schema<ITrialClassDocument>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    mentor: { type: Schema.Types.ObjectId, ref: "Mentor" },
    status: {
      type: String,
      enum: ["requested", "assigned", "completed", "cancelled"],
      default: "requested",
    },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    notes: { type: String },
    meetLink: { type: String },
    feedback: {
      rating: Number,
      comment: String,
    },
  },
  { timestamps: true }
);

export const TrialClass = model<ITrialClassDocument>("TrialClass", TrialClassSchema);
