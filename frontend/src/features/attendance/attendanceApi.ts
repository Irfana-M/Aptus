import api from "../../api/api";

export const attendanceApi = {
    markPresent: async (sessionId: string) => {
        const response = await api.post(`/attendance/session/${sessionId}/present`);
        return response.data;
    },
    markAbsent: async (sessionId: string, reason?: string) => {
        const response = await api.post(`/attendance/session/${sessionId}/absent`, { reason });
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/attendance/history');
        return response.data;
    },
    getAllAttendanceAdmin: async () => {
        const response = await api.get('/attendance/admin/history');
        return response.data;
    }
};
