import mongoose, { Schema } from "mongoose";
import type { MentorProfile } from "@/interfaces/models/mentor.interface";
import { ApprovalStatus } from "../../domain/enums/ApprovalStatus";
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
    maxStudentsPerWeek: { type: Number, default: 20 },
    maxSessionsPerDay: { type: Number, default: 5 },
    maxSessionsPerWeek: { type: Number, default: 25 },
    currentWeeklyBookings: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    approvalStatus: {
      type: String,
      enum: Object.values(ApprovalStatus),
      default: ApprovalStatus.NOT_SUBMITTED,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String },
    submittedForApprovalAt: { type: Date },
    rejectionReason: { type: String },
    leaves: [{
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      reason: { type: String },
      approved: { type: Boolean, default: false }
    }],
    commissionPercentage: { type: Number, default: 60 }
  },

  { timestamps: true }
);

export const MentorModel = mongoose.model<MentorProfile>(
  "Mentor",
  mentorSchema
);

// Register alias "mentor" for refPath compatibility
try {
  mongoose.model("mentor");
} catch {
  mongoose.model("mentor", mentorSchema);
}
