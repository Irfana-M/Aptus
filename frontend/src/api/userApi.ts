import api, { type ApiResponse } from "./api";

export interface UserNotification {
  _id: string;
  userId: string;
  userType: 'student' | 'mentor' | 'admin';
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface SessionParticipant {
  userId: string;
  role: 'student' | 'mentor';
  status: 'scheduled' | 'present' | 'absent' | 'cancelled';
}

export interface UpcomingSession {
  _id: string;
  timeSlotId: string;
  mentorId: string;
  studentId?: string;
  subjectId: { _id: string; subjectName: string };
  sessionType: 'group' | 'one-to-one';
  status: string;
  startTime: string;
  endTime: string;
  participants: SessionParticipant[];
  webRTCId?: string;
  title?: string;
}

export const getUserNotifications = async (): Promise<ApiResponse<UserNotification[]>> => {
  const response = await api.get<ApiResponse<UserNotification[]>>("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.patch<ApiResponse<void>>(`/notifications/${id}/read`);
  return response.data;
};

export const getStudentUpcomingSessions = async (): Promise<ApiResponse<UpcomingSession[]>> => {
    const response = await api.get<ApiResponse<UpcomingSession[]>>("/sessions/student/upcoming");
    return response.data;
}

export const getMentorUpcomingSessions = async (): Promise<ApiResponse<UpcomingSession[]>> => {
    const response = await api.get<ApiResponse<UpcomingSession[]>>("/sessions/mentor/upcoming");
    return response.data;
}

export const getMentorTodaySessions = async (): Promise<ApiResponse<UpcomingSession[]>> => {
    const response = await api.get<ApiResponse<UpcomingSession[]>>("/sessions/mentor/today");
    return response.data;
}

const userApi = {
    getUserNotifications,
    markNotificationAsRead,
    getStudentUpcomingSessions,
    getMentorUpcomingSessions,
    getMentorTodaySessions
};

export default userApi;
