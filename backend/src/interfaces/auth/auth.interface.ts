import type { SubscriptionDetails } from "../models/student.interface";

export interface BaseUser {
  _id: string;
  email: string;
  password: string;
  role: 'mentor' | 'student';
  isVerified: boolean;
  isBlocked?: boolean | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AuthUser extends BaseUser {
  fullName: string;
  phoneNumber: string;
  isProfileComplete?: boolean | undefined;
  approvalStatus?: "pending" | "approved" | "rejected" | undefined;
  id?: string | undefined;
  subscription?: SubscriptionDetails | undefined;
  isPaid?: boolean | undefined;
  hasPaid?: boolean | undefined;
  isTrialCompleted?: boolean | undefined;
  profileImageUrl?: string | null | undefined;
}


export interface MentorAuthUser extends Omit<AuthUser, 'role'> {
  role: "mentor";
  academicQualifications?: {
    institutionName: string;
    degree: string;
    graduationYear: string
  }[] | undefined;
  subjectProficiency?: {
    subject: string;
    level: string
  }[] | undefined;
  profilePicture?: string | undefined;
}

export interface StudentAuthUser extends Omit<AuthUser, 'role'> {
  role: "student";
  isPaid?: boolean | undefined;
  hasPaid?: boolean | undefined;
  gradeLevel?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string;
  relationship?: string;
  isTrialCompleted?: boolean | undefined;
  isProfileCompleted?: boolean;
  referralCode?: string;
  referredBy?: string;
  profileImage?: string;
  profileImageKey?: string;
  subscription?: SubscriptionDetails | undefined;
  
  // Profile fields
  age?: number | undefined;
  gender?: string | undefined;
  dateOfBirth?: Date | undefined;
  contactInfo?: {
    address: string;
    country: string;
    postalCode: string;
    parentInfo: {
      name: string;
      email: string;
      phoneNumber: string;
      relationship: string;
    }
  } | undefined;
  academicDetails?: {
    institutionName: string;
    grade: string;
    syllabus: string;
  } | undefined;
  goal?: string | undefined;
  authProvider?: "local" | "google" | undefined;
  googleId?: string | undefined;
}