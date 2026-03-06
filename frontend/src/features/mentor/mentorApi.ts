import api from "../../api/api";
import { API_ROUTES } from "../../constants/apiRoutes";

export const mentorApi = {
  updateMentorProfile: async (formData: FormData) => {
    const response = await api.put(API_ROUTES.MENTOR.PROFILE_UPDATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  submitProfileForApproval: async () => {
    const response = await api.post(API_ROUTES.MENTOR.SUBMIT_APPROVAL);
    return response.data;
  },

  getMentorProfile: async () => {
    const response = await api.get(API_ROUTES.MENTOR.PROFILE);
    return response.data.data;
  },

  getPendingMentors: async () => {
    const response = await api.get(API_ROUTES.MENTOR.ADMIN_PENDING);
    return response.data;
  },

  approveMentor: async (mentorId: string) => {
    const response = await api.post(API_ROUTES.MENTOR.ADMIN_APPROVE.replace(":mentorId", mentorId));
    return response.data;
  },

  rejectMentor: async (mentorId: string, reason: string) => {
    const response = await api.post(API_ROUTES.MENTOR.ADMIN_REJECT.replace(":mentorId", mentorId), {
      reason,
    });
    return response.data;
  },

  getMentorTrialClasses: async () => {
    const response = await api.get(API_ROUTES.MENTOR.TRIAL_CLASSES);
    const data = response.data.data;
    if (data && typeof data === 'object' && 'items' in data) {
      return data.items;
    }
    return data || [];
  },

  updateTrialClassStatus: async (trialId: string, status: string) => {
    const url = API_ROUTES.MENTOR.TRIAL_CLASS_STATUS.replace(":id", trialId);
    const response = await api.patch(url, { status });
    return response.data;
  },
  
  getMentorCourses: async () => {
    const response = await api.get(API_ROUTES.MENTOR.COURSES);
    return response.data.data;
  },

  getAvailability: async (mentorId: string) => {
    const response = await api.get(`/availability/${mentorId}`);
    return response.data.data;
  },

  getDailySessions: async (date?: string) => {
    const response = await api.get(API_ROUTES.MENTOR.SESSIONS, {
      params: { date }
    });
    return response.data.data;
  },
  
  getUpcomingSessions: async () => {
    const response = await api.get(API_ROUTES.MENTOR.UPCOMING_SESSIONS);
    return response.data.data;
  },

  getMyLeaves: async (params?: { page?: number; limit?: number; status?: string }) => {
    const response = await api.get(API_ROUTES.MENTOR.MY_LEAVES, {
      params
    });
    return response.data;
  },

  requestLeave: async (data: { startDate: string; endDate: string; reason: string }) => {
    const response = await api.post(API_ROUTES.MENTOR.LEAVE_REQUEST, data);
    return response.data;
  },
  getMentorAssignments: async () => {
    const response = await api.get('/mentor/assignments');
    return response.data;
  },
  getDashboardData: async () => {
    const response = await api.get('/mentor/dashboard');
    return response.data.data;
  },
};
