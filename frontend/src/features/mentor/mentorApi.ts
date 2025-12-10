import authApi from "../../api/authApi";

export const mentorApi = {
  updateMentorProfile: async (formData: FormData) => {
    const response = await authApi.put("/mentor/me/profile-update", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  submitProfileForApproval: async () => {
    const response = await authApi.post("/mentor/me/submit-approval");
    return response.data;
  },

  getMentorProfile: async () => {
    const response = await authApi.get("/mentor/me/profile");
    return response.data.data;
  },

  getPendingMentors: async () => {
    const response = await authApi.get("/mentor/admin/pending");
    return response.data;
  },

  approveMentor: async (mentorId: string) => {
    const response = await authApi.post(`/mentor/admin/${mentorId}/approve`);
    return response.data;
  },

  rejectMentor: async (mentorId: string, reason: string) => {
    const response = await authApi.post(`/mentor/admin/${mentorId}/reject`, {
      reason,
    });
    return response.data;
  },

  getMentorTrialClasses: async () => {
    const response = await authApi.get("/mentor/me/trial-classes");
    return response.data.data;
  },
};
