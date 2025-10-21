import authApi from "../../api/authApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";

export interface AdminLoginDto {
  email: string;
  password: string;
}

export const adminApi = {
  login: (data: AdminLoginDto) =>
    authApi.post<AdminLoginResponse>("/admin/login", data),
  logout: () => authApi.post<{ message: string }>("/admin/logout"),
};

export const adminMentorApi = {
  fetchMentorProfile: (mentorId: string) =>
    authApi.get(`/admin/mentors/${mentorId}`),
  approveMentor: (mentorId: string) =>
    authApi.patch(`/admin/mentors/${mentorId}/approve`),
  rejectMentor: (mentorId: string, reason: string) =>
    authApi.patch(`/admin/mentors/${mentorId}/reject`, { reason }),
};
