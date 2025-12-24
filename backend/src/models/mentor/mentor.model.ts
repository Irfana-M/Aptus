import mongoose, { Schema } from "mongoose";
import type { MentorProfile } from "@/interfaces/models/mentor.interface";
const academicQualificationSchema = new Schema({
  institutionName: String,
  degree: String,
  graduationYear: String,
});

const experienceSchema = new Schema({
  institution: String,
  jobTitle: String,
  duration: String,
});

const certificationSchema = new Schema({
  name: String,
  issuingOrganization: String,
});

const subjectProficiencySchema = new Schema({
  subject: { type: String, required: true },
  level: {
    type: String,
    enum: ["basic", "intermediate", "expert"],
    required: true,
  },
});

const timeSlotSchema = new Schema({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false }
});

const availabilitySchema = new Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true 
  },
  slots: [timeSlotSchema]
});

const mentorSchema = new Schema<MentorProfile>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String },
    password: { type: String },
    location: { type: String },
    bio: { type: String },
    academicQualifications: [academicQualificationSchema],
    experiences: [experienceSchema],
    certification: [certificationSchema],
    subjectProficiency: [subjectProficiencySchema],
    profilePicture: { type: String },
    availability: [availabilitySchema],
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    expertise: [{ type: String }], 
    maxStudentsPerWeek: { type: Number, default: 10 },
    currentWeeklyBookings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String },
    submittedForApprovalAt: { type: Date },
    rejectionReason: { type: String },
  },

  { timestamps: true }
);

export const MentorModel = mongoose.model<MentorProfile>(
  "Mentor",
  mentorSchema
);
