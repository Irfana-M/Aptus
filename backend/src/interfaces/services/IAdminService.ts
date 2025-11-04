import type { AdminLoginResponseDto } from "@/dto/admin/AdminLoginResponseDTO";
import type { DashboardDataDto } from "@/dto/admin/AdminLoginResponseDTO";
import type { MentorResponseDto } from "@/dto/mentor/MentorResponseDTO";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";

export interface IAdminService {
  login(email: string, password: string): Promise<AdminLoginResponseDto>;

  getDashboardData(): Promise<DashboardDataDto>;

  getAllMentors(): Promise<MentorResponseDto[]>;
  fetchMentorProfile(mentorId: string): Promise<MentorResponseDto>;
  updateMentorApprovalStatus(
    mentorId: string,
    status: "approved" | "rejected",
    adminId: string,
    reason?: string
  ): Promise<MentorResponseDto>;

  getAllStudents(): Promise<StudentBaseResponseDto[]>;
}
