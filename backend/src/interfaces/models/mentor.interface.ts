import { ApprovalStatus } from '../../domain/enums/ApprovalStatus.js';

export interface MentorRegisterInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface MentorDBInput {
  _id?: string | undefined;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isBlocked?: boolean | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface StudentOtp extends MentorRegisterInput {
  otp?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;
}

export interface AcademicQualification {
  institutionName: string;
  degree: string;
  graduationYear: string;
}

export interface Experience {
  institution: string;
  jobTitle: string;
  duration: string;
}

export interface SubjectProficency {
  subject: string;
  level: "basic" | "intermediate" | "expert";
}

export interface Certification {
  name: string;
  issuingOrganization: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked?: boolean;
}

export interface Availability {
  day: string; 
  slots: TimeSlot[];
}

export interface LeaveEntry {
  startDate: Date;
  endDate: Date;
  reason?: string;
  approved: boolean;
}

export interface MentorProfile {
  _id: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;

  location?: string | undefined;
  bio?: string | undefined;
  academicQualifications?: AcademicQualification[] | undefined;
  experiences?: Experience[] | undefined;
  subjectProficiency?: SubjectProficency[] | undefined;
  certification?: Certification[] | undefined;
  profilePicture?: string | undefined;

  availability?: Availability[] | undefined;
  rating?: number | undefined;
  totalRatings?: number | undefined;
  expertise?: string[] | undefined;
  maxStudentsPerWeek?: number | undefined;
  maxSessionsPerDay?: number | undefined;
  maxSessionsPerWeek?: number | undefined;
  currentWeeklyBookings?: number | undefined;
  isActive?: boolean | undefined;
  
  profileImageUrl?: string | null | undefined;
  profileImageKey?: string | undefined;
  isVerified?: boolean | undefined;
  isBlocked: boolean;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
  isProfileComplete?: boolean | undefined;
  approvalStatus?: ApprovalStatus | undefined;
  submittedForApprovalAt?: Date | undefined;
  rejectionReason?: string | undefined;
  authProvider?: "local" | "google" | undefined;
  googleId?: string | undefined;
  conflictingBookings?: unknown[] | undefined;
  leaves?: LeaveEntry[] | undefined;
  commissionPercentage?: number | undefined;
}
