export interface BaseUserResponseDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "student" | "mentor";
  isVerified: boolean;
  isProfileComplete?: boolean;
}

export interface MentorBaseResponseDto extends BaseUserResponseDto {
  approvalStatus?: "approved" | "pending" | "rejected";
}

export interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

export interface SubscriptionDetails {
  plan: 'monthly' | 'yearly';
  startDate: string | Date;
  endDate: string | Date;
  renewalDate?: string | Date;
  expiryDate?: string | Date;
  subjectCount?: number;
  availability?: AvailabilitySlot[];
  status: 'active' | 'expired' | 'cancelled';
  paymentIntentId?: string;
  sessionId?: string;
}

export interface StudentBaseResponseDto extends BaseUserResponseDto {
  isPaid?: boolean;
  isBlocked?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  trialClasses?: TrialClassSummary[];
  pendingTrialClasses?: number;
  totalTrialClasses?: number;
  subscription?: SubscriptionDetails;
}

export interface TrialClassSummary {
  id: string;
  status: 'requested' | 'assigned' | 'completed' | 'cancelled';
  subject: string;
  preferredDate: string;
  preferredTime: string;
  assignedMentor?: string;
}
export interface TrialClass {
  id: string;
  _id?: string;
  student?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string;
  };
  subject: {
    id: string;
    subjectName: string;
    syllabus?: string;
    grade?: number | string;
  };
  status: 'requested' | 'assigned' | 'completed' | 'cancelled' | 'approved';
  preferredDate: string;
  preferredTime: string;
  scheduledDateTime?: string;
  mentor?: {
    id: string;
    name: string;
    email: string;
  };
  meetLink?: string;
  notes?: string;
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseRequest {
  id: string;
  student: string | {
    id: string;
    fullName: string;
    email: string;
  };
  subject: string;
  grade: string;
  mentoringMode: "one-to-one" | "one-to-many";
  preferredDays: string[];
  timeSlot: string;
  timezone?: string;
  status: "pending" | "reviewed" | "fulfilled" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}
