import type {  StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { MentorResponseDto } from "@/dto/mentor/MentorResponseDTO";

export interface VerificationResponse {
  success: boolean;
  user?: MentorResponseDto | StudentBaseResponseDto;
  error?: string;
}

export interface UserExistenceResponse {
  exists: boolean;
  role?: 'mentor' | 'student' | null | undefined;
  email?: string | undefined;
}

export interface UserEmailResponse {
  success: boolean;
  email?: string;
  role?: string;
  error?: string;
}

export interface IUserRoleService {
  verifyUserRole(userId: string, role: 'mentor' | 'student' | 'admin'): Promise<VerificationResponse>;
  
  getUserByIdAndRole(userId: string, role: 'mentor' | 'student'): Promise<MentorResponseDto | StudentBaseResponseDto | null>;
  
  verifyTrialClassAuthorization(
    trialClassId: string, 
    userId: string, 
    role: 'mentor' | 'student'
  ): Promise<{
    authorized: boolean;
    trialClass?: unknown;
    error?: string;
  }>;
  
  userExists(userId: string): Promise<UserExistenceResponse>;
  
  getUserFromToken(token: string): Promise<VerificationResponse>;
  getUserEmail(userId: string): Promise<UserEmailResponse>;
}