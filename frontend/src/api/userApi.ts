import api from "./api";
import type { ApiResponse } from "../types/api.types";

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

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationMeta;
}

export const getUserNotifications = async (page = 1, limit = 10): Promise<ApiResponse<PaginatedData<UserNotification>>> => {
  const response = await api.get<ApiResponse<PaginatedData<UserNotification>>>(`/notifications?page=${page}&limit=${limit}`);
  return response.data;
};

export const markNotificationAsRead = async (id: string): Promise<ApiResponse<void>> => {
  const response = await api.patch<ApiResponse<void>>(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<ApiResponse<{ count: number }>> => {
  const response = await api.patch<ApiResponse<{ count: number }>>('/notifications/read-all');
  return response.data;
};

export const getStudentUpcomingSessions = async (page = 1, limit = 10): Promise<ApiResponse<PaginatedData<UpcomingSession>>> => {
    const response = await api.get<ApiResponse<PaginatedData<UpcomingSession>>>(`/sessions/student/upcoming?page=${page}&limit=${limit}`);
    return response.data;
}

export const getMentorUpcomingSessions = async (page = 1, limit = 10): Promise<ApiResponse<PaginatedData<UpcomingSession>>> => {
    const response = await api.get<ApiResponse<PaginatedData<UpcomingSession>>>(`/sessions/mentor/upcoming?page=${page}&limit=${limit}`);
    return response.data;
}

export const getMentorTodaySessions = async (): Promise<ApiResponse<UpcomingSession[]>> => {
    const response = await api.get<ApiResponse<UpcomingSession[]>>("/sessions/mentor/today");
    return response.data;
}

const userApi = {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getStudentUpcomingSessions,
    getMentorUpcomingSessions,
    getMentorTodaySessions
};

export default userApi;
