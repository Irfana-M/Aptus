import api from '../../api/api';
import { API_ROUTES } from '../../constants/apiRoutes';

export const sessionApi = {
    fetchStudentUpcomingSessions: async (filter?: { from?: string; to?: string; page?: number; limit?: number }) => {
        const response = await api.get(API_ROUTES.SESSIONS.STUDENT_UPCOMING, { params: filter });
        return response.data;
    },
    fetchMentorUpcomingSessions: async (filter?: { from?: string; to?: string; page?: number; limit?: number }) => {
        const response = await api.get(API_ROUTES.SESSIONS.MENTOR_UPCOMING, { params: filter });
        return response.data;
    },
    fetchMentorTodaySessions: async () => {
        const response = await api.get(API_ROUTES.SESSIONS.MENTOR_TODAY);
        return response.data;
    },
    reportAbsence: async (sessionId: string, reason: string) => {
        const url = API_ROUTES.SESSIONS.REPORT_ABSENCE.replace(':sessionId', sessionId);
        const response = await api.post(url, { reason });
        return response.data;
    },
    cancelSession: async (sessionId: string, reason: string) => {
        const url = API_ROUTES.SESSIONS.CANCEL.replace(':sessionId', sessionId);
        const response = await api.post(url, { reason });
        return response.data;
    },
    resolveRescheduling: async (sessionId: string, newTimeSlotId?: string, slotDetails?: { date: string, startTime: string, endTime: string }) => {
        const url = API_ROUTES.SESSIONS.RESOLVE_RESCHEDULING.replace(':sessionId', sessionId);
        const response = await api.post(url, { newTimeSlotId, ...slotDetails });
        return response.data;
    },
    completeSession: async (sessionId: string) => {
        const url = API_ROUTES.SESSIONS.COMPLETE.replace(':sessionId', sessionId);
        const response = await api.post(url);
        return response.data;
    },
    getSessionById: async (sessionId: string) => {
        const url = API_ROUTES.SESSIONS.DETAILS.replace(':sessionId', sessionId);
        const response = await api.get(url);
        return response.data;
    },
    getAvailableSlotsForReschedule: async (mentorId: string, subjectId: string, date: string) => {
        const response = await api.get(API_ROUTES.SESSIONS.AVAILABLE_SLOTS, { 
            params: { mentorId, subjectId, date } 
        });
        return response.data;
    }
};
