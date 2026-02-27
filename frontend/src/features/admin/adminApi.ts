import type { AxiosResponse } from "axios";
import adminApi from "../../api/adminApi";
import { API_ROUTES } from "../../constants/apiRoutes";
import type { AdminLoginResponse } from "../../types/dtoTypes";
import type { StudentBaseResponseDto } from "../../types/studentTypes";
import { logger } from "../../utils/logger";
import type { MentorProfile } from "../mentor/mentorSlice";
import type { Course } from "../../types/courseTypes";
import type { StudentProfile } from "../../types/student.types";
import type { Enrollment } from "../../types/enrollmentTypes";
import type { MentorRequestListItem, CourseRequest } from "../../types/adminTypes";

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
    return adminApi.get<MentorProfile[]>(API_ROUTES.ADMIN.MENTORS);
  },
  fetchMentorProfile: (mentorId: string): Promise<AxiosResponse<{ success: boolean; data: MentorProfile }>> =>
    adminApi.get<{ success: boolean; data: MentorProfile }>(API_ROUTES.ADMIN.MENTOR_DETAILS.replace(":mentorId", mentorId)),
  approveMentor: (mentorId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    adminApi.patch<{ success: boolean; message: string }>(API_ROUTES.ADMIN.MENTOR_APPROVE.replace(":mentorId", mentorId)),
  rejectMentor: (mentorId: string, reason: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    adminApi.patch<{ success: boolean; message: string }>(API_ROUTES.ADMIN.MENTOR_REJECT.replace(":mentorId", mentorId), { reason }),
  blockMentor: (mentorId: string): Promise<AxiosResponse<{ success: boolean; data: MentorProfile }>> => 
    adminApi.patch<{ success: boolean; data: MentorProfile }>(API_ROUTES.ADMIN.MENTOR_BLOCK.replace(":mentorId", mentorId)),
  
  unblockMentor: (mentorId: string): Promise<AxiosResponse<{ success: boolean; data: MentorProfile }>> => 
    adminApi.patch<{ success: boolean; data: MentorProfile }>(API_ROUTES.ADMIN.MENTOR_UNBLOCK.replace(":mentorId", mentorId)),
  
  updateMentor: (mentorId: string, data: Partial<MentorProfile>): Promise<AxiosResponse<{ success: boolean; data: MentorProfile }>> => 
    adminApi.put<{ success: boolean; data: MentorProfile }>(API_ROUTES.ADMIN.MENTOR_UPDATE.replace(":mentorId", mentorId), data),
  
  addMentor: (mentorData: Partial<MentorProfile>): Promise<AxiosResponse<{ success: boolean; data: MentorProfile }>> => 
    adminApi.post<{ success: boolean; data: MentorProfile }>(API_ROUTES.ADMIN.MENTORS, mentorData),
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

  blockStudent: (studentId: string): Promise<AxiosResponse<{ success: boolean; data: StudentBaseResponseDto }>> => 
    adminApi.patch<{ success: boolean; data: StudentBaseResponseDto }>(API_ROUTES.ADMIN.STUDENT_BLOCK.replace(":studentId", studentId)),
  
  unblockStudent: (studentId: string): Promise<AxiosResponse<{ success: boolean; data: StudentBaseResponseDto }>> => 
    adminApi.patch<{ success: boolean; data: StudentBaseResponseDto }>(API_ROUTES.ADMIN.STUDENT_UNBLOCK.replace(":studentId", studentId)),
  
  updateStudent: (studentId: string, data: Partial<StudentBaseResponseDto>): Promise<AxiosResponse<{ success: boolean; data: StudentBaseResponseDto }>> => 
    adminApi.put<{ success: boolean; data: StudentBaseResponseDto }>(API_ROUTES.ADMIN.STUDENT_UPDATE.replace(":studentId", studentId), data),

  searchStudents: (query: string): Promise<AxiosResponse<{ success: boolean; data: StudentBaseResponseDto[] }>> => {
    logger.api(`${API_ROUTES.ADMIN.STUDENT_SEARCH}?query=${query}`, "GET");
    return adminApi.get<{ success: boolean; data: StudentBaseResponseDto[] }>(`${API_ROUTES.ADMIN.STUDENT_SEARCH}?query=${query}`);
  },

  getTrialClasses: (filters?: { status?: string; page?: number; limit?: number }): Promise<AxiosResponse<{ success: boolean; data: unknown[] }>> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `${API_ROUTES.ADMIN.TRIAL_CLASSES}?${queryString}` : API_ROUTES.ADMIN.TRIAL_CLASSES;
    
    return adminApi.get<{ success: boolean; data: unknown[] }>(url);
  },
  
  getAvailableMentors: (params: { subjectId: string; preferredDate: string }): Promise<AxiosResponse<{ success: boolean; data: unknown[] }>> =>
    adminApi.get<{ success: boolean; data: unknown[] }>(API_ROUTES.ADMIN.AVAILABLE_MENTORS, { params }),
   assignMentor: (trialClassId: string, data: {
    mentorId: string;
    scheduledDate: string;
    scheduledTime: string;
    meetLink?: string;
  }): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return adminApi.patch<{ success: boolean; message: string }>(API_ROUTES.ADMIN.TRIAL_CLASS_ASSIGN_MENTOR.replace(":trialClassId", trialClassId), data);
  },


   getStudentTrialClasses: (studentId: string, status?: string): Promise<AxiosResponse<{ success: boolean; data: unknown[] }>> => {
    const params = status ? { status } : {};
    return adminApi.get<{ success: boolean; data: unknown[] }>(API_ROUTES.ADMIN.STUDENT_TRIAL_CLASSES.replace(":studentId", studentId), { params });
  },

  getTrialClassDetails: (trialClassId: string): Promise<AxiosResponse<{ success: boolean; data: unknown }>> => {
    return adminApi.get<{ success: boolean; data: unknown }>(API_ROUTES.ADMIN.TRIAL_CLASS_DETAILS.replace(":trialClassId", trialClassId));
  },

  updateTrialClassStatus: (trialClassId: string, data: { status: string; reason?: string }): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
    return adminApi.patch<{ success: boolean; message: string }>(API_ROUTES.ADMIN.TRIAL_CLASS_STATUS.replace(":trialClassId", trialClassId), data);
  },

  assignMentorToStudent: (data: { studentId: string; subjectId: string; mentorId: string; preferredDate?: string; days?: string[]; timeSlot?: string }): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
     return adminApi.post<{ success: boolean; message: string }>(API_ROUTES.ADMIN.STUDENT_ASSIGN_MENTOR, data);
  },

  reassignMentorToStudent: (data: { studentId: string; subjectId: string; newMentorId: string; reason?: string; days?: string[]; timeSlot?: string }): Promise<AxiosResponse<{ success: boolean; message: string }>> => {
     return adminApi.post<{ success: boolean; message: string }>(API_ROUTES.ADMIN.STUDENT_REASSIGN_MENTOR, data);
  },
  
};



export const adminCourseApi = {
  
  getGrades: (): Promise<AxiosResponse<{ success: boolean; data: unknown[] }>> => adminApi.get<{ success: boolean; data: unknown[] }>(`${API_ROUTES.ADMIN.GRADES}?active=true`),

  
  getSubjectsByGrade: (gradeId: string): Promise<AxiosResponse<{ success: boolean; data: unknown[] }>> =>
    adminApi.get<{ success: boolean; data: unknown[] }>(`${API_ROUTES.ADMIN.SUBJECTS}?gradeId=${gradeId}&isActive=true`),

 
  getAvailableMentorsForCourse: (params: {
    gradeId?: string;
    subjectId: string;
    days?: string[];
    timeSlot?: string;
    excludeCourseId?: string;
  }): Promise<AxiosResponse<{ success: boolean; data: { matches: MentorProfile[]; alternates: MentorProfile[] } }>> => {
    if (!params.subjectId) {
      logger.error("subjectId is missing in getAvailableMentorsForCourse call");
      throw new Error("subjectId is required for mentor search");
    }

    const queryParams: Record<string, string | number | boolean | undefined> = { 
      gradeId: params.gradeId,
      subjectId: params.subjectId,
      timeSlot: params.timeSlot,
      excludeCourseId: params.excludeCourseId
    };
    
    // Ensure array is joined for Backend (comma separated)
    if (params.days && Array.isArray(params.days)) {
      queryParams.days = params.days.join(',');
    }
    
    logger.api(API_ROUTES.ADMIN.MENTORS_AVAILABLE_FOR_COURSE, "GET", queryParams);
    return adminApi.get<{ success: boolean; data: { matches: MentorProfile[]; alternates: MentorProfile[] } }>(API_ROUTES.ADMIN.MENTORS_AVAILABLE_FOR_COURSE, { params: queryParams });
  },

  
  createCourse: (data: {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    studentId?: string;
    courseType?: "one-to-one" | "group";
    maxStudents?: number;
    schedule: {
      days: string[];
      timeSlot?: string;
    };
    startDate: string;
    endDate: string;
    fee: number;
  }): Promise<AxiosResponse<{ success: boolean; data: Course }>> => adminApi.post<{ success: boolean; data: Course }>(API_ROUTES.ADMIN.ONE_TO_ONE_COURSES, data),

  updateCourse: (courseId: string, data: {
    gradeId?: string;
    subjectId?: string;
    mentorId?: string;
    studentId?: string;
    courseType?: "one-to-one" | "group";
    maxStudents?: number;
    schedule?: {
      days: string[];
      timeSlot?: string;
    };
    startDate?: string;
    endDate?: string;
    fee?: number;
    status?: string;
  }): Promise<AxiosResponse<{ success: boolean; data: Course }>> => adminApi.put<{ success: boolean; data: Course }>(`/admin/courses/one-to-one/${courseId}`, data),

  enrollStudentToCourse: (courseId: string, studentId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    adminApi.post<{ success: boolean; message: string }>(API_ROUTES.ADMIN.COURSE_ENROLL.replace(":courseId", courseId), { studentId }),

  unenrollStudentFromCourse: (courseId: string, studentId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
    adminApi.delete<{ success: boolean; message: string }>(API_ROUTES.ADMIN.COURSE_UNENROLL.replace(":courseId", courseId).replace(":studentId", studentId)),

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
    return adminApi.get<Course[]>(API_ROUTES.ADMIN.ALL_COURSES);
  },
};

export const adminRequestsApi = {
  getAllRequests: (): Promise<AxiosResponse<{ success: boolean; data: CourseRequest[] }>> => adminApi.get(API_ROUTES.COURSE_REQUESTS.ALL),
  updateRequestStatus: (requestId: string, status: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => 
    adminApi.patch(API_ROUTES.COURSE_REQUESTS.STATUS.replace(":requestId", requestId), { status }),
};

export const adminStudentProfileApi = {
  getStudentProfile: (studentId: string): Promise<AxiosResponse<{ success: boolean; data: StudentProfile }>> =>
    adminApi.get(API_ROUTES.ADMIN.STUDENT_PROFILE.replace(":studentId", studentId)),
};

export const adminEnrollmentApi = {
  fetchAllEnrollments: (): Promise<AxiosResponse<{ success: boolean; data: Enrollment[] }>> => adminApi.get(API_ROUTES.ADMIN.ALL_ENROLLMENTS),
};

export const adminMentorRequestApi = {
  fetchAllRequests: (): Promise<AxiosResponse<{ success: boolean; data: MentorRequestListItem[] }>> => adminApi.get(API_ROUTES.ADMIN.MENTOR_REQUESTS),
  approveRequest: (requestId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => adminApi.patch(API_ROUTES.ADMIN.MENTOR_REQUEST_APPROVE.replace(':requestId', requestId)),
  rejectRequest: (requestId: string, reason: string): Promise<AxiosResponse<{ success: boolean; message: string }>> => adminApi.patch(API_ROUTES.ADMIN.MENTOR_REQUEST_REJECT.replace(':requestId', requestId), { reason }),
};
