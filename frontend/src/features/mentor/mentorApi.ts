import userApi from "../../api/userApi";
import { API_ROUTES } from "../../constants/apiRoutes";

export const mentorApi = {
  updateMentorProfile: async (formData: FormData) => {
    const response = await userApi.put(API_ROUTES.MENTOR.PROFILE_UPDATE, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  submitProfileForApproval: async () => {
    const response = await userApi.post(API_ROUTES.MENTOR.SUBMIT_APPROVAL);
    return response.data;
  },

  getMentorProfile: async () => {
    const response = await userApi.get(API_ROUTES.MENTOR.PROFILE);
    return response.data.data;
  },

  getPendingMentors: async () => {
    const response = await userApi.get(API_ROUTES.MENTOR.ADMIN_PENDING);
    return response.data;
  },

  approveMentor: async (mentorId: string) => {
    const response = await userApi.post(API_ROUTES.MENTOR.ADMIN_APPROVE.replace(":mentorId", mentorId));
    return response.data;
  },

  rejectMentor: async (mentorId: string, reason: string) => {
    const response = await userApi.post(API_ROUTES.MENTOR.ADMIN_REJECT.replace(":mentorId", mentorId), {
      reason,
    });
    return response.data;
  },

  getMentorTrialClasses: async () => {
    const response = await userApi.get(API_ROUTES.MENTOR.TRIAL_CLASSES);
    return response.data.data;
  },

  updateTrialClassStatus: async (trialId: string, status: string) => {
    const url = API_ROUTES.MENTOR.TRIAL_CLASS_STATUS.replace(":id", trialId);
    const response = await userApi.patch(url, { status });
    return response.data;
  },
  
  getMentorCourses: async () => {
    const response = await userApi.get(API_ROUTES.MENTOR.COURSES);
    return response.data.data;
  },
};
