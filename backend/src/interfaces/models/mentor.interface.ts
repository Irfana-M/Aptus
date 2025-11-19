export interface MentorRegisterInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface MentorDBInput {
  _id?: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isBlocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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

export interface Availability {
  dayOfWeek: number; 
  timeSlots: string[]; 
  timezone: string;
}

export interface MentorProfile {
  _id: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;

  location?: string;
  bio?: string;
  academicQualifications?: AcademicQualification[];
  experiences?: Experience[];
  subjectProficiency?: SubjectProficency[];
  certification?: Certification[];
  profilePicture?: string;

  availability?: Availability[];
  rating?: number;
  totalRatings?: number;
  expertise?: string[];
  maxStudentsPerWeek?: number;
  currentWeeklyBookings?: number;
  isActive?: boolean;
  
  profileImageUrl?: string | null;
  profileImageKey?: string;
  isVerified?: boolean;
  isBlocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  isProfileComplete?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  submittedForApprovalAt?: Date;
  rejectionReason?: string;
  authProvider?: "local" | "google";
  googleId?: string;
}
