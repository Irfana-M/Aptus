import authApi from "../../api/authApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { logger } from "../../utils/logger";
import type { MentorProfile } from "../mentor/mentorSlice";

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AddStudentRequestDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface AddStudentResponseDto {
  success: boolean;
  message: string;
  data: StudentBaseResponseDto;
}

export interface StudentsWithStatsResponse {
  success: boolean;
  data: {
    students: StudentBaseResponseDto[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalStudents: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
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
  blockMentor: (mentorId: string) => 
    authApi.patch(`/admin/mentors/${mentorId}/block`),
  
  unblockMentor: (mentorId: string) => 
    authApi.patch(`/admin/mentors/${mentorId}/unblock`),
  
  updateMentor: (mentorId: string, data: Partial<MentorProfile>) => 
    authApi.put(`/admin/mentors/${mentorId}`, data),
  
  addMentor: (mentorData: any) => 
    authApi.post('/admin/mentors', mentorData),
};

export const adminStudentApi = {
  getAllStudents: (): Promise<any> => {
    logger.api("/admin/students", "GET");
    return authApi.get<StudentBaseResponseDto[]>("/admin/students");
  },

  getStudentsWithStats: (params: { page?: number; limit?: number } = {}): Promise<any> => {
    const { page = 1, limit = 10 } = params;
    logger.api(`/admin/students-with-stats?page=${page}&limit=${limit}`, "GET");
    return authApi.get<StudentsWithStatsResponse>(`/admin/students-with-stats?page=${page}&limit=${limit}`);
  },

  addStudent: (studentData: AddStudentRequestDto): Promise<any> => {
    logger.api("/admin/students", "POST", studentData);
    return authApi.post<AddStudentResponseDto>("/admin/students", studentData);
  },

  blockStudent: (studentId: string) => 
    authApi.patch(`/admin/students/${studentId}/block`),
  
  unblockStudent: (studentId: string) => 
    authApi.patch(`/admin/students/${studentId}/unblock`),
  
  updateStudent: (studentId: string, data: Partial<StudentBaseResponseDto>) => 
    authApi.put(`/admin/students/${studentId}`, data),

  getTrialClasses: (filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/admin/trial-classes?${queryString}` : '/admin/trial-classes';
    
    return authApi.get(url);
  },
  
  getAvailableMentors: (params: { subjectId: string; preferredDate: string }) =>
    authApi.get('/admin/available-mentors', { params }),
   assignMentor: (trialClassId: string, data: {
    mentorId: string;
    scheduledDate: string;
    scheduledTime: string;
    meetLink?: string;
  }) => {
    return authApi.patch(`/admin/trial-classes/${trialClassId}/assign-mentor`, data);
  },


   getStudentTrialClasses: (studentId: string, status?: string) => {
    const params = status ? { status } : {};
    return authApi.get(`/admin/students/${studentId}/trial-classes`, { params });
  },

  getTrialClassDetails: (trialClassId: string) => {
    return authApi.get(`/admin/trial-classes/${trialClassId}`);
  },

  updateTrialClassStatus: (trialClassId: string, data: { status: string; reason?: string }) => {
    return authApi.patch(`/admin/trial-classes/${trialClassId}/status`, data);
  },
  
};
