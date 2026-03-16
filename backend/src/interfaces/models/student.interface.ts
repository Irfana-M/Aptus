import type { Types } from "mongoose";

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

export interface SubscriptionDetails {
  plan: 'monthly' | 'yearly'; 
  planCode?: string;
  planType?: 'basic' | 'premium';
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'cancelled';
  sessionId?: string;
  paymentIntentId?: string;
  paymentId?: import('mongoose').Types.ObjectId;
  subjectCount?: number;
  availability?: Availability[];
}

export interface StudentRegisterInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

export interface StudentDBInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isBlocked?: boolean;
}

export interface StudentOtp extends StudentRegisterInput {
  otp?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;
}

export interface ParentInfo {
  name: string;
  email: string;
  phoneNumber: string;
  relationship: string;
}

export interface contactInfo {
  parentInfo: ParentInfo;
  address: string;
  country: string;
  postalCode: string;
}

export interface AcademicDetails {
  institutionName: string;
  grade: string;
  syllabus: string;
}

export interface SubjectPreference {
  subjectId: Types.ObjectId;
  slots: Availability[];
  status?: 'preferences_submitted' | 'mentor_requested' | 'mentor_assigned' | 'active' | 'reassigned';
  assignedMentorId?: Types.ObjectId;
}

export interface StudentProfile {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  age?: number | undefined;
  gender?: string | undefined;
  dateOfBirth?: Date | undefined;
  contactInfo?: contactInfo | undefined;
  academicDetails?: AcademicDetails | undefined;
  profileImage?: string | undefined;
  profileImageKey?: string | undefined;
  profileImageUrl?: string | undefined;
  goal?: string | undefined;
  isVerified?: boolean;
  isBlocked: boolean;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  hasPaid?: boolean; // Deprecated, use subscription instead
  subscription?: SubscriptionDetails | undefined;
  isTrialCompleted?: boolean;
  isProfileCompleted?: boolean;
  authProvider?: "local" | "google" | undefined;
  googleId?: string | undefined;
  gradeId?: Types.ObjectId | undefined;
  activeSubscriptionId?: Types.ObjectId | undefined;
  referralCode?: string | undefined;
  referredBy?: string | undefined;
  onboardingStatus?: string | undefined;
  preferencesCompleted?: boolean | undefined;
  preferredSubjects?: (Types.ObjectId | any)[] | undefined;
  preferredTimeSlots?: any[] | undefined;
  cancellationCount?: number;
}
