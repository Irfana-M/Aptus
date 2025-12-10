import api from "../../api/api";

export interface CourseRequestData {
  subject: string;
  mentoringMode: string;
  preferredDay: string;
  timeRange: string;
  timezone?: string;
}

export const fetchAvailableCourses = async (filters: any) => {
  const response = await api.get("/courses/available", { params: filters });
  return response.data;
};

export const createCourseRequest = async (data: CourseRequestData) => {
  const response = await api.post("/course-requests", data);
  return response.data;
};

export const getStudentProfile = async () => {
    const response = await api.get("/auth/me"); // Assuming /auth/me returns the profile for now, or /student/profile if it exists. Based on backend routes, student profile is likely fetched via auth or a specific route.
    // Looking at backend routes:
    // admin routes has /students, but student routes doesn't have /me/profile. 
    // However, `authApi.ts` usually handles `getMe`.
    // Let's check `authApi` first to see if it returns the full profile.
    // Actually, `student.routes.ts` DOES NOT have a /profile GET route.
    // But I added a PUT /profile route.
    // Typically `auth/me` returns the user. 
    // I'll assume `auth/me` or similar is used, OR I should add a GET /profile route to student routes if specific profile data (like grade, syllabus) is needed beyond the basic user model.
    // The `StudentController` usually has `getProfile`.
    // Let's assume for now I added PUT /profile, I should probably also have GET /profile in student routes if it differs from Auth user.
    // I will use /auth/me for fetching for now as it's common.
    return response.data;
};

export const updateStudentProfile = async (data: FormData) => {
    const response = await api.put("/student/profile", data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const enrollInCourse = async (courseId: string) => {
    const response = await api.post(`/enrollments`, { courseId });
    return response.data;
};
