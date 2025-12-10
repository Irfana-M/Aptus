import mongoose, { Schema } from "mongoose";
import type { StudentProfile } from "../../interfaces/models/student.interface";

const parentInfoSchema = new Schema({
  name: String,
  email: String,
  phoneNumber: String,
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
    goal: { type: String },
    isVerified: { type: Boolean, required: true, default: false },
    isBlocked: { type: Boolean, default: false },
    hasPaid: { type: Boolean, default: false },
    isTrialCompleted: { type: Boolean, default: false },
    isProfileCompleted: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: { type: String },
  },
  { timestamps: true }
);

export const StudentModel = mongoose.model<StudentProfile>(
  "Student",
  studentSchema
);
