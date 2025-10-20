import authApi from "../../api/authApi";

export const mentorApi = {
  // ✅ Create or update mentor profile (including picture)
  updateMentorProfile: async (formData: FormData) => {
    const response = await authApi.put("/mentor/me/profile-update", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // ✅ Submit profile for admin approval
  submitProfileForApproval: async () => {
    const response = await authApi.post("/mentor/me/submit-approval");
    return response.data;
  },

  // ✅ Get logged-in mentor’s profile
  getMentorProfile: async () => {
    const response = await authApi.get("/mentor/me/profile");
    return response.data;
  },

  // ✅ Admin side: Get all pending mentor requests
  getPendingMentors: async () => {
    const response = await authApi.get("/mentor/admin/pending");
    return response.data;
  },

  // ✅ Admin side: Approve mentor
  approveMentor: async (mentorId: string) => {
    const response = await authApi.post(`/mentor/admin/${mentorId}/approve`);
    return response.data;
  },

  // ✅ Admin side: Reject mentor
  rejectMentor: async (mentorId: string, reason: string) => {
    const response = await authApi.post(`/mentor/admin/${mentorId}/reject`, { reason });
    return response.data;
  },
};
