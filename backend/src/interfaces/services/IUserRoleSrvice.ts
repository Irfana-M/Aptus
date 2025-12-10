import type {  StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { MentorResponseDto } from "@/dto/mentor/MentorResponseDTO";

export interface IUserRoleService {
  verifyUserRole(userId: string, role: 'mentor' | 'student'): Promise<{
    success: boolean;
    user?: MentorResponseDto | StudentBaseResponseDto;
    error?: string;
  }>;
  
  getUserByIdAndRole(userId: string, role: 'mentor' | 'student'): Promise<MentorResponseDto | StudentBaseResponseDto | null>;
  
  verifyTrialClassAuthorization(
    trialClassId: string, 
    userId: string, 
    role: 'mentor' | 'student'
  ): Promise<{
    authorized: boolean;
    trialClass?: any;
    error?: string;
  }>;
  
  userExists(userId: string): Promise<{
    exists: boolean;
    role?: 'mentor' | 'student' | null | undefined;
    email?: string | undefined;
  }>;
  
  // Optional methods if needed
  getUserFromToken?(token: string): Promise<any>;
  getUserEmail?(userId: string): Promise<any>;
}