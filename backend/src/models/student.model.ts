import mongoose, { Schema } from 'mongoose';
import type { StudentProfile } from '../interfaces/student.interface.js';

const parentInfoSchema = new Schema({
  name: String,
  email: String,
  phone: String,
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
    phone: { type: String, required: true },
    password: { type: String, required: true },
    age: { type: Number },
    gender: { type: String },
    dateOfBirth: { type: Date },
    contactInfo: contactInfoSchema,
    academicDetails: academicDetailsSchema,
    profileImage: { type: String },
    goal: { type: String },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const StudentModel = mongoose.model<StudentProfile>('Student', studentSchema)