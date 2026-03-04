import type {  StudentBaseResponseDto } from "../../dtos/auth/UserResponseDTO.js";
import type { MentorResponseDto } from "../../dtos/mentor/MentorResponseDTO.js";

export interface TrialClassAuthData {
  id?: string | undefined;
  status?: string;
  studentId?: string | undefined;
  mentorId?: string | undefined;
  preferredDate?: Date | string;
  meetLink?: string;
}

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
    trialClass?: TrialClassAuthData;
    error?: string;
    isSession?: boolean;
  }>;
  
  userExists(userId: string): Promise<UserExistenceResponse>;
  
  getUserFromToken(token: string): Promise<VerificationResponse>;
  getUserEmail(userId: string): Promise<UserEmailResponse>;
}