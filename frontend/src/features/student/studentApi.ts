import api from "../../api/api";
import userApi from "../../api/userApi";
import { API_ROUTES } from "../../constants/apiRoutes";

export interface CourseRequestData {
  subject: string;
  grade: string;
  mentoringMode: string;
  preferredDays: string[];
  timeSlot: string;
  timezone?: string;
}


export const fetchAvailableCourses = async (filters: Record<string, unknown>) => {
  const response = await api.get(API_ROUTES.COURSES.AVAILABLE, { params: filters });
  return response.data;
};

export const findMentors = async (subject: string, grade?: string, days?: string[], timeSlot?: string) => {
  const params: any = { subject };
  if (grade) params.grade = grade;
  if (days && days.length > 0) params.days = days.join(',');
  if (timeSlot) params.timeSlot = timeSlot;

  const response = await userApi.get(API_ROUTES.AVAILABILITY.MATCH, { 
    params: params
  });
  return response.data;
};

export const fetchMentorDetails = async (mentorId: string) => {
  const url = API_ROUTES.AVAILABILITY.PROFILE.replace(':mentorId', mentorId);
  const response = await userApi.get(url);
  return response.data?.data || response.data;
};

export const fetchSubjectsByGrade = async (grade: string, syllabus?: string) => {
    // If grade is 'all', we might want a different endpoint or query

    const response = await api.get(API_ROUTES.STUDENT.GET_BY_GRADE, { 
        params: { grade, syllabus } 
    });
    return response.data;
};

export const createCourseRequest = async (data: CourseRequestData) => {
  const response = await userApi.post(API_ROUTES.COURSE_REQUESTS.BASE, data);
  return response.data;
};

export const getStudentProfile = async () => {
    const response = await userApi.get(API_ROUTES.STUDENT.PROFILE);
    // Return the full student profile data
    return response.data?.data || response.data;
};

export const updateStudentProfile = async (data: FormData) => {
    const response = await userApi.put(API_ROUTES.STUDENT.PROFILE, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data?.data || response.data;
};

export const enrollInCourse = async (courseId: string) => {
    // Construct URL: /enrollments/enroll/:courseId
    // API_ROUTES.ENROLLMENTS.BASE is "/enrollments"
    const response = await userApi.post(`${API_ROUTES.ENROLLMENTS.BASE}/enroll/${courseId}`);
    return response.data;
};

export const fetchMyEnrollments = async () => {
    const response = await userApi.get(API_ROUTES.ENROLLMENTS.MY_ENROLLMENTS);
    return response.data;
};

export const fetchMyCourses = async () => {
    const response = await userApi.get(API_ROUTES.STUDENT.MY_COURSES);
    return response.data;
};

export const fetchMyCourseRequests = async () => {
    const response = await userApi.get(API_ROUTES.COURSE_REQUESTS.BASE);
    return response.data;
};

export const fetchPaymentHistory = async () => {
    const response = await userApi.get(API_ROUTES.STUDENT.PAYMENT_HISTORY);
    return response.data;
};

export const updatePreferences = async (preferences: any[]) => {
    const response = await userApi.patch('/student/preferences', { preferences });
    return response.data;
};

export const requestMentor = async (data: { subjectId: string; mentorId: string }) => {
    const response = await userApi.post('/student/request-mentor', data);
    return response.data;
};

export const fetchMyMentorRequests = async () => {
    const response = await userApi.get('/student/mentor-requests');
    return response.data;
};

export const getWallet = async () => {
    const response = await userApi.get('/student/wallet'); 
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
    getWallet,
    updatePreferences,
    requestMentor,
    fetchMyMentorRequests
};
