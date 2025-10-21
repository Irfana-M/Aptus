import type { RootState } from "../../app/store";

export const selectAdmin = (state: RootState) => state.admin.admin;
export const selectAccessToken = (state: RootState) => state.admin.accessToken;
export const selectRefreshToken = (state: RootState) => state.admin.refreshToken;

export const selectMentorProfile = (state: RootState) => state.admin.mentorProfile;

export const selectAdminLoading = (state: RootState) => state.admin.loading;
export const selectAdminError = (state: RootState) => state.admin.error;