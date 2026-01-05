import type { AxiosResponse } from "axios";
import adminApi from "../../api/adminApi";
import { API_ROUTES } from "../../constants/apiRoutes";
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
  message?: string;
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

export const adminAuthApi = {
  login: (data: AdminLoginDto) =>
    adminApi.post<AdminLoginResponse>(API_ROUTES.ADMIN.LOGIN, data),
  logout: () => adminApi.post<{ message: string }>(API_ROUTES.ADMIN.LOGOUT),
  refreshToken: () => adminApi.post<AdminLoginResponse>(API_ROUTES.ADMIN.REFRESH),
};

export const adminMentorApi = {
  fetchAllMentors: (params?: MentorPaginationParams): Promise<AxiosResponse<PaginatedResponse<MentorProfile> | MentorProfile[]>> => {
    if (params && Object.keys(params).some(key => params[key as keyof MentorPaginationParams] !== undefined)) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.subject) queryParams.append('subject', params.subject);
      
      const queryString = queryParams.toString();
      logger.api(`${API_ROUTES.ADMIN.MENTORS}?${queryString}`, "GET");
      return adminApi.get<PaginatedResponse<MentorProfile>>(`${API_ROUTES.ADMIN.MENTORS}?${queryString}`);
    }
    // Fallback to original behavior for backward compatibility
    return adminApi.get(API_ROUTES.ADMIN.MENTORS);
  },
  fetchMentorProfile: (mentorId: string) =>
    adminApi.get(API_ROUTES.ADMIN.MENTOR_DETAILS.replace(":mentorId", mentorId)),
  approveMentor: (mentorId: string) =>
    adminApi.patch(API_ROUTES.ADMIN.MENTOR_APPROVE.replace(":mentorId", mentorId)),
  rejectMentor: (mentorId: string, reason: string) =>
    adminApi.patch(API_ROUTES.ADMIN.MENTOR_REJECT.replace(":mentorId", mentorId), { reason }),
  blockMentor: (mentorId: string) => 
    adminApi.patch(API_ROUTES.ADMIN.MENTOR_BLOCK.replace(":mentorId", mentorId)),
  
  unblockMentor: (mentorId: string) => 
    adminApi.patch(API_ROUTES.ADMIN.MENTOR_UNBLOCK.replace(":mentorId", mentorId)),
  
  updateMentor: (mentorId: string, data: Partial<MentorProfile>) => 
    adminApi.put(API_ROUTES.ADMIN.MENTOR_UPDATE.replace(":mentorId", mentorId), data),
  
  addMentor: (mentorData: Partial<MentorProfile>) => 
    adminApi.post<MentorProfile>(API_ROUTES.ADMIN.MENTORS, mentorData),
};

export const adminStudentApi = {
  getAllStudents: (params?: StudentPaginationParams): Promise<AxiosResponse<PaginatedResponse<StudentBaseResponseDto> | StudentBaseResponseDto[]>> => {
    if (params && Object.keys(params).some(key => params[key as keyof StudentPaginationParams] !== undefined)) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.verification) queryParams.append('verification', params.verification);
      
      const queryString = queryParams.toString();
      logger.api(`${API_ROUTES.ADMIN.STUDENTS}?${queryString}`, "GET");
      return adminApi.get<PaginatedResponse<StudentBaseResponseDto>>(`${API_ROUTES.ADMIN.STUDENTS}?${queryString}`);
    }
    // Fallback to original behavior for backward compatibility
    logger.api(API_ROUTES.ADMIN.STUDENTS, "GET");
    return adminApi.get<StudentBaseResponseDto[]>(API_ROUTES.ADMIN.STUDENTS);
  },

  getStudentsWithStats: (params: { page?: number; limit?: number } = {}): Promise<AxiosResponse<StudentsWithStatsResponse>> => {
    const { page = 1, limit = 10 } = params;
    logger.api(`${API_ROUTES.ADMIN.STUDENTS_WITH_STATS}?page=${page}&limit=${limit}`, "GET");
    return adminApi.get<StudentsWithStatsResponse>(`${API_ROUTES.ADMIN.STUDENTS_WITH_STATS}?page=${page}&limit=${limit}`);
  },

  addStudent: (studentData: AddStudentRequestDto): Promise<AxiosResponse<AddStudentResponseDto>> => {
    logger.api(API_ROUTES.ADMIN.STUDENTS, "POST", studentData);
    return adminApi.post<AddStudentResponseDto>(API_ROUTES.ADMIN.STUDENTS, studentData);
  },

  blockStudent: (studentId: string) => 
    adminApi.patch(API_ROUTES.ADMIN.STUDENT_BLOCK.replace(":studentId", studentId)),
  
  unblockStudent: (studentId: string) => 
    adminApi.patch(API_ROUTES.ADMIN.STUDENT_UNBLOCK.replace(":studentId", studentId)),
  
  updateStudent: (studentId: string, data: Partial<StudentBaseResponseDto>) => 
    adminApi.put(API_ROUTES.ADMIN.STUDENT_UPDATE.replace(":studentId", studentId), data),

  getTrialClasses: (filters?: { status?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${API_ROUTES.ADMIN.TRIAL_CLASSES}?${queryString}` : API_ROUTES.ADMIN.TRIAL_CLASSES;
    
    return adminApi.get(url);
  },
  
  getAvailableMentors: (params: { subjectId: string; preferredDate: string }) =>
    adminApi.get(API_ROUTES.ADMIN.AVAILABLE_MENTORS, { params }),
   assignMentor: (trialClassId: string, data: {
    mentorId: string;
    scheduledDate: string;
    scheduledTime: string;
    meetLink?: string;
  }) => {
    return adminApi.patch(API_ROUTES.ADMIN.TRIAL_CLASS_ASSIGN_MENTOR.replace(":trialClassId", trialClassId), data);
  },


   getStudentTrialClasses: (studentId: string, status?: string) => {
    const params = status ? { status } : {};
    return adminApi.get(API_ROUTES.ADMIN.STUDENT_TRIAL_CLASSES.replace(":studentId", studentId), { params });
  },

  getTrialClassDetails: (trialClassId: string) => {
    return adminApi.get(API_ROUTES.ADMIN.TRIAL_CLASS_DETAILS.replace(":trialClassId", trialClassId));
  },

  updateTrialClassStatus: (trialClassId: string, data: { status: string; reason?: string }) => {
    return adminApi.patch(API_ROUTES.ADMIN.TRIAL_CLASS_STATUS.replace(":trialClassId", trialClassId), data);
  },

  assignMentorToStudent: (data: { studentId: string; subjectId: string; mentorId: string; preferredDate?: string; days?: string[]; timeSlot?: string }) => {
     return adminApi.post(API_ROUTES.ADMIN.STUDENT_ASSIGN_MENTOR, data);
  },

  reassignMentorToStudent: (data: { studentId: string; subjectId: string; newMentorId: string; reason?: string; days?: string[]; timeSlot?: string }) => {
     return adminApi.post(API_ROUTES.ADMIN.STUDENT_REASSIGN_MENTOR, data);
  },
  
};



export const adminCourseApi = {
  
  getGrades: () => adminApi.get(`${API_ROUTES.ADMIN.GRADES}?active=true`),

  
  getSubjectsByGrade: (gradeId: string) =>
    adminApi.get(`${API_ROUTES.ADMIN.SUBJECTS}?gradeId=${gradeId}&isActive=true`),

 
  getAvailableMentorsForCourse: (params: {
    gradeId?: string;
    subjectId: string;
    days?: string[];
    timeSlot?: string;
    excludeCourseId?: string;
  }) => {
    if (!params.subjectId) {
      logger.error("subjectId is missing in getAvailableMentorsForCourse call");
      throw new Error("subjectId is required for mentor search");
    }

    const queryParams: Record<string, any> = { ...params };
    
    // Ensure array is joined for Backend (comma separated)
    if (params.days && Array.isArray(params.days)) {
      queryParams.days = params.days.join(',');
    }
    
    logger.api(API_ROUTES.ADMIN.MENTORS_AVAILABLE_FOR_COURSE, "GET", queryParams);
    return adminApi.get(API_ROUTES.ADMIN.MENTORS_AVAILABLE_FOR_COURSE, { params: queryParams });
  },

  
  createOneToOneCourse: (data: {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    studentId?: string;
    schedule: {
      days: string[];
      timeSlot?: string;
    };
    startDate: string;
    endDate: string;
    fee: number;
  }) => adminApi.post(API_ROUTES.ADMIN.ONE_TO_ONE_COURSES, data),

  updateCourse: (courseId: string, data: {
    gradeId?: string;
    subjectId?: string;
    mentorId?: string;
    studentId?: string;
    schedule?: {
      days: string[];
      timeSlot?: string;
    };
    startDate?: string;
    endDate?: string;
    fee?: number;
    status?: string;
  }) => adminApi.put(`/admin/courses/one-to-one/${courseId}`, data),

  getAllOneToOneCourses: (params?: CoursePaginationParams): Promise<AxiosResponse<PaginatedResponse<Course> | Course[]>> => {
    if (params && Object.keys(params).some(key => params[key as keyof CoursePaginationParams] !== undefined)) {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.gradeId) queryParams.append('gradeId', params.gradeId);
      
      const queryString = queryParams.toString();
      logger.api(`${API_ROUTES.ADMIN.ALL_COURSES}?${queryString}`, "GET");
      return adminApi.get<PaginatedResponse<Course>>(`${API_ROUTES.ADMIN.ALL_COURSES}?${queryString}`);
    }
    // Fallback to original behavior
    return adminApi.get(API_ROUTES.ADMIN.ALL_COURSES);
  },
};

export const adminRequestsApi = {
  getAllRequests: () => adminApi.get(API_ROUTES.COURSE_REQUESTS.ALL),
  updateRequestStatus: (requestId: string, status: string) => 
    adminApi.patch(API_ROUTES.COURSE_REQUESTS.STATUS.replace(":requestId", requestId), { status }),
};

export const adminStudentProfileApi = {
  getStudentProfile: (studentId: string) =>
    adminApi.get(API_ROUTES.ADMIN.STUDENT_PROFILE.replace(":studentId", studentId)),
};

export const adminEnrollmentApi = {
  fetchAllEnrollments: () => adminApi.get(API_ROUTES.ADMIN.ALL_ENROLLMENTS),
};

export const adminMentorRequestApi = {
  fetchAllRequests: () => adminApi.get(API_ROUTES.ADMIN.MENTOR_REQUESTS),
  approveRequest: (requestId: string) => adminApi.patch(API_ROUTES.ADMIN.MENTOR_REQUEST_APPROVE.replace(':requestId', requestId)),
  rejectRequest: (requestId: string, reason: string) => adminApi.patch(API_ROUTES.ADMIN.MENTOR_REQUEST_REJECT.replace(':requestId', requestId), { reason }),
};
