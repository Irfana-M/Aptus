import type { Enrollment } from "./enrollmentTypes";
import type { TrialClass } from "./trialTypes";

export interface SubscriptionDetails {
  plan: 'monthly' | 'yearly';
  planCode?: string;
  planType?: 'basic' | 'premium';
  startDate: Date | string;
  endDate: Date | string;
  status: 'active' | 'expired' | 'cancelled';
  sessionId?: string;
  paymentIntentId?: string;
  renewalDate?: string | Date;
  expiryDate?: string | Date;
  subjectCount?: number;
  availability?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];
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
    gradeId?: string; // Some versions might have it here
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
  preferredSubjects?: string[];
  preferredTimeSlots?: SubjectPreference[];
  isPaid?: boolean;
  trialClasses?: TrialClass[];
  enrollments?: Enrollment[];
}
