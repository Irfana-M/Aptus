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

export interface StudentBaseResponseDto extends BaseUserResponseDto {
  isPaid?: boolean;
  isBlocked?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  trialClasses?: TrialClassSummary[];
  pendingTrialClasses?: number;
  totalTrialClasses?: number;
}

export interface TrialClassSummary {
  id: string;
  status: 'requested' | 'assigned' | 'completed' | 'cancelled';
  subject: string;
  preferredDate: string;
  preferredTime: string;
  assignedMentor?: string;
}
