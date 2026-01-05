import type { AdminLoginResponseDto } from "@/dto/admin/AdminLoginResponseDTO";
import type { DashboardDataDto } from "@/dto/admin/AdminLoginResponseDTO";
import type { MentorResponseDto } from "@/dto/mentor/MentorResponseDTO";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { MentorProfile } from "../models/mentor.interface";
import type { TrialClassResponseDto } from "@/dto/student/trialClassDTO";
import type { MentorPaginationParams, StudentPaginationParams, PaginatedResponse } from "@/dto/shared/paginationTypes";

export interface IAdminService {
  unblockStudent(studentId: string): unknown;
  login(email: string, password: string): Promise<AdminLoginResponseDto>;

  getDashboardData(): Promise<DashboardDataDto>;

  getAllMentors(): Promise<MentorResponseDto[]>;
  getAllMentorsPaginated(params: MentorPaginationParams): Promise<PaginatedResponse<MentorResponseDto>>;
  fetchMentorProfile(mentorId: string): Promise<MentorResponseDto>;
  updateMentorApprovalStatus(
    mentorId: string,
    status: "approved" | "rejected",
    adminId: string,
    reason?: string
  ): Promise<MentorResponseDto>;

  getAllStudents(): Promise<StudentBaseResponseDto[]>;
  getAllStudentsPaginated(params: StudentPaginationParams): Promise<PaginatedResponse<StudentBaseResponseDto>>;

  getStudentsWithTrialStats(page: number, limit: number): Promise<unknown>;

  blockMentor(mentorId: string): Promise<MentorResponseDto>;

  unblockMentor(mentorId: string): Promise<MentorResponseDto>;

  blockStudent(studentId: string): Promise<StudentBaseResponseDto>;

  addStudent(studentData: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  }): Promise<StudentBaseResponseDto>;

  addMentor(mentorData: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    location?: string;
    bio?: string;
  }): Promise<MentorResponseDto>;

  updateMentor(mentorId: string, data: Partial<MentorProfile>): Promise<MentorResponseDto>;
  updateStudent(studentId: string, data: Partial<StudentBaseResponseDto>): Promise<StudentBaseResponseDto>;
   getStudentTrialClasses(studentId: string, status?: string): Promise<TrialClassResponseDto[]>;
  getAllTrialClasses(filters: { status?: string; page?: number; limit?: number }): Promise<{
    trialClasses: TrialClassResponseDto[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalTrialClasses: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>;
  getTrialClassDetails(trialClassId: string): Promise<TrialClassResponseDto>;
  assignMentorToTrialClass(
    trialClassId: string,
    mentorId: string,
    scheduledDate: string,
    scheduledTime: string
  ): Promise<TrialClassResponseDto>;
  updateTrialClassStatus(
    trialClassId: string,
    status: string,
    reason?: string
  ): Promise<TrialClassResponseDto>;
  getAvailableMentors(
    subjectId: string, 
    preferredDate?: string,
    days?: string[],
    timeSlot?: string
  ): Promise<{ matches: MentorResponseDto[], alternates: MentorResponseDto[] }>;

  assignMentor(
    studentId: string, 
    subjectId: string, 
    mentorId: string, 
    adminId?: string,
    overrides?: {
      days?: string[];
      timeSlot?: string;
    }
  ): Promise<void>;
  reassignMentor(
    studentId: string, 
    subjectId: string, 
    newMentorId: string,
    adminId?: string,
    overrides?: {
      days?: string[];
      timeSlot?: string;
    }
  ): Promise<void>;
}

