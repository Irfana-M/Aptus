import type { RootState } from "../../app/store";

export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectIsVerified = (state: RootState) => state.auth.isVerified;