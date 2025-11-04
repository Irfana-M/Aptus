import authApi from "../../api/authApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { logger } from "../../utils/logger";

export interface AdminLoginDto {
  email: string;
  password: string;
}

export const adminApi = {
  login: (data: AdminLoginDto) =>
    authApi.post<AdminLoginResponse>("/admin/login", data),
  logout: () => authApi.post<{ message: string }>("/admin/logout"),
  refreshToken: () => authApi.post<AdminLoginResponse>("/admin/refresh"),
};

export const adminMentorApi = {
  fetchAllMentors: () => authApi.get("/admin/mentors"),
  fetchMentorProfile: (mentorId: string) =>
    authApi.get(`/admin/mentors/${mentorId}`),
  approveMentor: (mentorId: string) =>
    authApi.patch(`/admin/mentors/${mentorId}/approve`),
  rejectMentor: (mentorId: string, reason: string) =>
    authApi.patch(`/admin/mentors/${mentorId}/reject`, { reason }),
};

export const adminStudentApi = {
  getAllStudents: (): Promise<any> => {
    logger.api("/admin/students", "GET");
    return authApi.get<StudentBaseResponseDto[]>("/admin/students");
  },
};
