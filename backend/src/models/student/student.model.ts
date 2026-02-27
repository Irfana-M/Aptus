import mongoose, { Schema, Document } from "mongoose";
import type { StudentProfile } from "../../interfaces/models/student.interface";

const parentInfoSchema = new Schema({
  name: String,
  email: String,
  phoneNumber: String,
  relationship: String,
});

const contactInfoSchema = new Schema({
  parentInfo: parentInfoSchema,
  address: String,
  country: String,
  postalCode: String,
});

const academicDetailsSchema = new Schema({
  institutionName: String,
  grade: String,
  syllabus: String,
});

const studentSchema = new Schema<StudentProfile>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    phoneNumber: { type: String },
    password: { type: String },
    age: { type: Number },
    gender: { type: String },
    dateOfBirth: { type: Date },
    contactInfo: contactInfoSchema,
    academicDetails: academicDetailsSchema,
    gradeId: { type: Schema.Types.ObjectId, ref: 'Grade' },
    profileImage: { type: String },
    profileImageKey: { type: String },
    goal: { type: String },
    subscription: {
      plan: { type: String, enum: ['monthly', 'yearly'] },
      startDate: { type: Date },
      endDate: { type: Date },
      renewalDate: { type: Date },
      expiryDate: { type: Date },
      status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'expired' },
      sessionId: { type: String },
      paymentIntentId: { type: String },
      paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
      planCode: { type: String },
      planType: { type: String, enum: ['basic', 'premium'] },
      subjectCount: { type: Number, default: 1 },
      availability: [{
        day: String,
        startTime: String,
        endTime: String
      }]
    },
    isVerified: { type: Boolean, required: true, default: false },
    isBlocked: { type: Boolean, default: false },
    hasPaid: { type: Boolean, default: false },
    isTrialCompleted: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    onboardingStatus: { 
      type: String, 
      enum: ['registered', 'profile_complete', 'trial_booked', 'trial_attended', 'feedback_submitted', 'subscribed', 'preferences_completed'],
      default: 'registered' 
    },
    preferencesCompleted: { type: Boolean, default: false },
    preferredSubjects: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    preferredTimeSlots: [{
      subjectId: { type: Schema.Types.ObjectId, ref: 'Subject' },
      status: { 
        type: String, 
        enum: ['preferences_submitted', 'mentor_requested', 'mentor_assigned'],
        default: 'preferences_submitted'
      },
      assignedMentorId: { type: Schema.Types.ObjectId, ref: 'Mentor' },
      slots: [{
        day: String,
        startTime: String,
        endTime: String
      }]
    }],
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String },
    activeSubscriptionId: { type: Schema.Types.ObjectId, ref: 'StudentSubscription' },
    cancellationCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type StudentDocument = StudentProfile & Document;

export const StudentModel = mongoose.model<StudentProfile>(
  "Student",
  studentSchema
);

// Register alias "student" for refPath compatibility
try {
  mongoose.model("student");
} catch {
  mongoose.model("student", studentSchema);
}
