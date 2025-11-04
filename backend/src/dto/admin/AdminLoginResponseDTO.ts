import type { MentorResponseDto } from "../mentor/MentorResponseDTO";
import type { StudentBaseResponseDto } from "../auth/UserResponseDTO";

export interface AdminLoginResponseDto {
  admin: AdminResponseDto;
  accessToken: string;
  refreshToken: string;
}

export interface AdminResponseDto {
  _id: string;
  email: string;
  role: "admin";
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardDataDto {
  totalStudents: number;
  totalMentors: number;
  recentStudents: StudentBaseResponseDto[];
  recentMentors: MentorResponseDto[];
}
