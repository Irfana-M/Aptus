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

export interface StudentBaseResponseDto extends BaseUserResponseDto {
  isPaid?: boolean;
  isTrialCompleted?: boolean;
}
