import api from '../../api/api';
import { API_ROUTES } from '../../constants/apiRoutes';

export const sessionApi = {
    reportAbsence: async (sessionId: string, reason: string) => {
        const url = API_ROUTES.SESSIONS.DETAILS.replace(':sessionId', sessionId) + '/report-absence';
        const response = await api.post(url, { reason });
        return response.data;
    },
    cancelSession: async (sessionId: string, reason: string) => {
        const url = API_ROUTES.SESSIONS.DETAILS.replace(':sessionId', sessionId) + '/cancel';
        const response = await api.post(url, { reason });
        return response.data;
    },
    resolveRescheduling: async (sessionId: string, newTimeSlotId?: string, slotDetails?: { date: string, startTime: string, endTime: string }) => {
        const url = API_ROUTES.SESSIONS.DETAILS.replace(':sessionId', sessionId) + '/resolve-rescheduling';
        const response = await api.post(url, { newTimeSlotId, ...slotDetails });
        return response.data;
    },
    completeSession: async (sessionId: string) => {
        const url = API_ROUTES.SESSIONS.COMPLETE.replace(':sessionId', sessionId);
        const response = await api.post(url);
        return response.data;
    }
};
