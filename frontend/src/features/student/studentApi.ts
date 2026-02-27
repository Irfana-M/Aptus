import api, { type ApiResponse } from "../../api/api";
import { API_ROUTES } from "../../constants/apiRoutes";
import type { MentorProfile } from "../mentor/mentorSlice";
import type { Subject } from "../../types/adminTypes";

export interface CourseRequestData {
  subject: string;
  grade: string;
  mentoringMode: string;
  preferredDays: string[];
  timeSlot: string;
  timezone?: string;
}

export interface SubjectPreference {
    subjectId: string;
    slots: {
        day: string;
        startTime: string;
        endTime: string;
    }[];
}


export const fetchAvailableCourses = async (filters: Record<string, unknown>) => {
  const response = await api.get(API_ROUTES.COURSES.AVAILABLE, { params: filters });
  return response.data;
};

export interface MentorMatch {
    matches: MentorProfile[];
    alternates: MentorProfile[];
}

export const findMentors = async (subject: string, grade?: string, days?: string[], timeSlot?: string): Promise<ApiResponse<MentorMatch>> => {
  const params: Record<string, unknown> = { subject };
  if (grade) params.grade = grade;
  if (days && days.length > 0) params.days = days.join(',');
  if (timeSlot) params.timeSlot = timeSlot;

  const response = await api.get<ApiResponse<MentorMatch>>(API_ROUTES.AVAILABILITY.MATCH, { 
    params: params
  });
  return response.data;
};

export const fetchMentorDetails = async (mentorId: string): Promise<ApiResponse<MentorProfile>> => {
  const url = API_ROUTES.AVAILABILITY.PROFILE.replace(':mentorId', mentorId);
  const response = await api.get<ApiResponse<MentorProfile>>(url);
  return response.data;
};

export const fetchSubjectsByGrade = async (grade: string, syllabus?: string): Promise<ApiResponse<Subject[]>> => {
    const response = await api.get<ApiResponse<Subject[]>>(API_ROUTES.STUDENT.GET_BY_GRADE, { 
        params: { grade, syllabus } 
    });
    return response.data;
};

export const createCourseRequest = async (data: CourseRequestData) => {
  const response = await api.post(API_ROUTES.COURSE_REQUESTS.BASE, data);
  return response.data;
};

export const getStudentProfile = async () => {
    const response = await api.get(API_ROUTES.STUDENT.PROFILE);
    // Return the full student profile data
    return response.data?.data || response.data;
};

export const updateStudentProfile = async (data: FormData) => {
    const response = await api.put(API_ROUTES.STUDENT.PROFILE, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data?.data || response.data;
};

export const enrollInCourse = async (courseId: string) => {
    // Construct URL: /enrollments/enroll/:courseId
    // API_ROUTES.ENROLLMENTS.BASE is "/enrollments"
    const response = await api.post(`${API_ROUTES.ENROLLMENTS.BASE}/enroll/${courseId}`);
    return response.data;
};

export const fetchMyEnrollments = async () => {
    const response = await api.get(API_ROUTES.ENROLLMENTS.MY_ENROLLMENTS);
    return response.data;
};

export const fetchMyCourses = async (): Promise<ApiResponse<unknown[]>> => {
  const response = await api.get<ApiResponse<unknown[]>>(API_ROUTES.STUDENT.MY_COURSES);
  return response.data;
};

export const fetchUpcomingSessions = async () => {
    const response = await api.get('/student/sessions/upcoming');
    return response.data;
};

export const fetchMyCourseRequests = async () => {
    const response = await api.get(API_ROUTES.COURSE_REQUESTS.BASE);
    return response.data;
};

export const fetchPaymentHistory = async () => {
    const response = await api.get(API_ROUTES.STUDENT.PAYMENT_HISTORY);
    return response.data;
};

export const saveStudentPreferences = async (data: { preferences: SubjectPreference[] }): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/student/preferences/save', data);
    return response.data;
};

export const updateBasicPreferences = async (subjectIds: string[]) => {
    const response = await api.patch('/student/preferences/basic', { subjectIds });
    return response.data;
};

export const requestMentor = async (data: { subjectId: string; mentorId: string }): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>('/student/request-mentor', data);
    return response.data;
};

export interface MentorRequest {
    _id: string;
    mentorId?: { _id: string };
    subjectId?: { _id: string };
    status: string;
    createdAt: string;
}

export const fetchMyMentorRequests = async (): Promise<ApiResponse<MentorRequest[]>> => {
    const response = await api.get<ApiResponse<MentorRequest[]>>('/student/mentor-requests');
    return response.data;
};

export const getAvailableTrialSlots = async (subject: string, date: string) => {
    // Requires a new backend endpoint at /trial-class/available-slots
    // Creating query params
    const response = await api.get(`/trial-class/available-slots`, { 
        params: { subject, date } 
    });
    return response.data;
};

export const requestTrialClass = async (data: {
    subject: string;
    preferredDate: string;
    preferredTime: string;
}) => {
    const response = await api.post('/trial-class/request', data);
    return response.data;
};


export interface DayAvailability {
    day: string;
    date: string;
    slots: {
        _id?: string;
        startTime: string;
        endTime: string;
        remainingCapacity: number;
    }[];
}

export const getMentorAvailableSlots = async (mentorId: string): Promise<ApiResponse<DayAvailability[]>> => {
    const response = await api.get<ApiResponse<DayAvailability[]>>(`/mentor/${mentorId}/available-slots`);
    return response.data;
};

export const studentApi = {
    fetchAvailableCourses,
    fetchSubjectsByGrade,
    findMentors,
    fetchMentorDetails,
    createCourseRequest,
    getStudentProfile,
    updateStudentProfile,
    enrollInCourse,
    fetchMyEnrollments,
    fetchMyCourses,
    fetchMyCourseRequests,
    fetchPaymentHistory,
    updatePreferences: saveStudentPreferences,
    updateBasicPreferences,
    requestMentor,
    fetchMyMentorRequests,
    getMentorAvailableSlots
};
