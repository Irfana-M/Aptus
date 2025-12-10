import authApi from "../../api/authApi";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { logger } from "../../utils/logger";
import type { MentorProfile } from "../mentor/mentorSlice";
import type { Course } from "../../types/courseTypes";

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

// Pagination types for all admin management endpoints
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface MentorPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'pending' | 'approved' | 'rejected' | '';
  subject?: string;
}

export interface StudentPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'blocked' | '';
  verification?: 'verified' | 'pending' | '';
}

export interface CoursePaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'available' | 'booked' | 'ongoing' | 'completed' | 'cancelled' | '';
  gradeId?: string;
}

export const adminApi = {
  login: (data: AdminLoginDto) =>
    authApi.post<AdminLoginResponse>("/admin/login", data),
  logout: () => authApi.post<{ message: string }>("/admin/logout"),
  refreshToken: () => authApi.post<AdminLoginResponse>("/admin/refresh"),
};

export const adminMentorApi = {
  fetchAllMentors: (params?: MentorPaginationParams): Promise<any> => {
    if (params && Object.keys(params).some(key => params[key as keyof MentorPaginationParams] !== undefined)) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.subject) queryParams.append('subject', params.subject);
      
      const queryString = queryParams.toString();
      logger.api(`/admin/mentors?${queryString}`, "GET");
      return authApi.get<PaginatedResponse<MentorProfile>>(`/admin/mentors?${queryString}`);
    }
    // Fallback to original behavior for backward compatibility
    return authApi.get("/admin/mentors");
  },
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
  getAllStudents: (params?: StudentPaginationParams): Promise<any> => {
    if (params && Object.keys(params).some(key => params[key as keyof StudentPaginationParams] !== undefined)) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.verification) queryParams.append('verification', params.verification);
      
      const queryString = queryParams.toString();
      logger.api(`/admin/students?${queryString}`, "GET");
      return authApi.get<PaginatedResponse<StudentBaseResponseDto>>(`/admin/students?${queryString}`);
    }
    // Fallback to original behavior for backward compatibility
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



export const adminCourseApi = {
  
  getGrades: () => authApi.get("/admin/grades?active=true"),

  
  getSubjectsByGrade: (gradeId: string) =>
    authApi.get(`/admin/subjects?gradeId=${gradeId}&isActive=true`),

 
  getAvailableMentorsForCourse: (params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
  }) => authApi.get("/admin/mentors/available-for-course", { params }),

  
  createOneToOneCourse: (data: {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    dayOfWeek?: number;
    timeSlot?: string;
    startDate: string;
    endDate: string;
    fee: number;
  }) => authApi.post("/admin/courses/one-to-one", data),

  getAllOneToOneCourses: (params?: CoursePaginationParams): Promise<any> => {
    if (params && Object.keys(params).some(key => params[key as keyof CoursePaginationParams] !== undefined)) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.gradeId) queryParams.append('gradeId', params.gradeId);
      
      const queryString = queryParams.toString();
      logger.api(`/admin/courses/getAllCourses?${queryString}`, "GET");
      return authApi.get<PaginatedResponse<Course>>(`/admin/courses/getAllCourses?${queryString}`);
    }
    // Fallback to original behavior
    return authApi.get("/admin/courses/getAllCourses");
  },
};

export const adminRequestsApi = {
  getAllRequests: () => authApi.get("/course-requests/all"),
  updateRequestStatus: (requestId: string, status: string) => 
    authApi.patch(`/course-requests/${requestId}/status`, { status }),
};

export const adminStudentProfileApi = {
  getStudentProfile: (studentId: string) =>
    authApi.get(`/admin/students/${studentId}/profile`),
};
