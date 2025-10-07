import mongoose, { Schema } from 'mongoose';
import type { MentorProfile } from '../interfaces/models/mentor.interface.js';

const academicQualificationSchema = new Schema({
    institutionName: String,
    degree: String,
    graduationYear: String,
})

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
    enum: ['basic', 'intermediate', 'expert'],
    required: true,
  },
});

const mentorSchema = new Schema<MentorProfile>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNumber: { type: String, required: true },
    password: { type: String, required: true },
    location: { type: String },
    bio: { type: String },
    academicQualification: [academicQualificationSchema],
    experience: [experienceSchema],
    certification: [certificationSchema],
    subjectProficiency: [subjectProficiencySchema],
    profileMediaUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MentorModel = mongoose.model<MentorProfile>('Mentor', mentorSchema)