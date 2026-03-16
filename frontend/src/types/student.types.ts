import type { Course } from "./course.types";
import type { TrialClass, TrialClassResponse } from "./trial.types";
export type { TrialClass, TrialClassResponse };

// TrialClass is exported from trial.types.ts

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface SubscriptionDetails {
  plan: 'monthly' | 'yearly';
  planCode?: string;
  planType?: 'basic' | 'premium';
  startDate: Date | string;
  endDate: Date | string;
  renewalDate?: string | Date;
  expiryDate?: string | Date;
  subjectCount?: number;
  availability?: AvailabilitySlot[];
  status: 'active' | 'expired' | 'cancelled';
  paymentIntentId?: string;
  sessionId?: string;
}

export interface SubjectPreference {
  subjectId: string | { _id: string; subjectName: string };
  slots: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
  status?: 'preferences_submitted' | 'mentor_requested' | 'mentor_assigned' | 'active' | 'reassigned';
  assignedMentorId?: string;
}

export interface Enrollment {
  _id: string;
  student: string | {
    _id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
  };
  course: Course;
  enrollmentDate: string;
  status: "pending_payment" | "active" | "cancelled";
  progress?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfile {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: string;
  dateOfBirth: Date;
  contactInfo: {
    parentInfo: {
      name: string;
      email: string;
      phoneNumber: string;
      relationship?: string;
    };
    address: string;
    country: string;
    postalCode: string;
  };
  academicDetails: {
    institutionName: string;
    grade: string;
    syllabus: string;
    gradeId?: string;
  };
  profileImage: string;
  goal?: string;
  profileImageUrl?: string;
  isVerified?: boolean;
  isBlocked: boolean;
  createdAt?: string;
  updatedAt?: string;
  hasPaid?: boolean;
  subscription?: SubscriptionDetails;
  isTrialCompleted?: boolean;
  isProfileCompleted?: boolean;
  authProvider?: "local" | "google";
  gradeId?: string | { _id: string; name: string };
  onboardingStatus?: string;
  preferencesCompleted?: boolean;
  preferredSubjects?: (string | { _id: string; subjectName: string })[];
  preferredTimeSlots?: SubjectPreference[];
  isPaid?: boolean;
  trialClasses?: TrialClass[];
  enrollments?: Enrollment[];
}

export interface BaseUserResponseDto {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "student" | "mentor";
  isVerified: boolean;
  isProfileComplete?: boolean;
  profileImageUrl?: string;
  profilePicture?: string;
}

export interface StudentBaseResponseDto extends BaseUserResponseDto {
  isPaid?: boolean;
  isBlocked?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  trialClasses?: any[]; 
  pendingTrialClasses?: number;
  totalTrialClasses?: number;
  isTrialCompleted?: boolean;
  subscription?: SubscriptionDetails;
}

export interface CourseRequest {
  _id: string;
  id: string;
  student: string | { _id: string; fullName: string; email: string };
  subject: string;
  grade: string;
  gradeId?: string;
  subjectId?: string;
  syllabus?: string;
  mentoringMode: 'one-to-one' | 'group' | string;
  timeSlot: string;
  preferredDays: string[];
  timezone: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'reviewed';
  createdAt: string;
}
