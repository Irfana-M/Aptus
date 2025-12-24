export interface BaseUserResponseDto {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: "student" | "mentor";
  isVerified: boolean;
  isProfileComplete?: boolean;
  isBlocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
export interface MentorBaseResponseDto extends BaseUserResponseDto {
  approvalStatus?: "approved" | "pending" | "rejected";
}

export interface SubscriptionDetails {
  plan: 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  paymentIntentId?: string;
  sessionId?: string;
}

export interface StudentBaseResponseDto extends BaseUserResponseDto {
  isTrialCompleted?: boolean;
  subscription?: SubscriptionDetails | undefined;
  
  // Profile fields for DTO
  age?: number | undefined;
  gender?: string | undefined;
  dateOfBirth?: Date | undefined;
  gradeLevel?: string | undefined;
  school?: string | undefined;
  parentName?: string | undefined;
  parentPhone?: string | undefined;
  relationship?: string | undefined;
}
