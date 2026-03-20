import axiosInstance from './axiosInstance';
import type { Session } from '../types/scheduling.types';
import type { ApiResponse } from '../types/api.types';

export interface SessionFilter {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export class SessionService {
  async getStudentUpcomingSessions(filter?: SessionFilter): Promise<ApiResponse<{ items: Session[]; total: number }>> {
    const response = await axiosInstance.get('/sessions/student/upcoming', { params: filter });
    return response.data;
  }

  async getMentorUpcomingSessions(filter?: SessionFilter): Promise<ApiResponse<{ items: Session[]; total: number }>> {
    const response = await axiosInstance.get('/sessions/mentor/upcoming', { params: filter });
    return response.data;
  }

  async reportAbsence(sessionId: string, reason: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post(`/sessions/${sessionId}/leave`, { reason });
    return response.data;
  }

  async cancelSession(sessionId: string, reason: string): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post(`/sessions/${sessionId}/cancel`, { reason });
    return response.data;
  }

  async resolveRescheduling(sessionId: string, data: { newTimeSlotId?: string; date?: string; startTime?: string; endTime?: string }): Promise<ApiResponse<void>> {
    const response = await axiosInstance.post(`/sessions/${sessionId}/reschedule`, data);
    return response.data;
  }
}

export const sessionService = new SessionService();
