import type { RootState } from "../../app/store";
import { createSelector } from "@reduxjs/toolkit";

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsVerified = (state: RootState) => state.auth.isVerified;
export const selectIsProfileComplete = (state: RootState) =>
  state.auth.isProfileComplete;
export const selectIsPaid = (state: RootState) => state.auth.isPaid;

export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => user?.role
);

export const selectRedirectPath = createSelector(
  [selectCurrentUser, selectIsProfileComplete, selectIsPaid],
  (user, isProfileComplete, isPaid) => {
    if (!user) return "/login";

    if (user.role === "mentor") {
      return isProfileComplete ? "/mentor/dashboard" : "/mentor/profile-setup";
    }

    if (user.role === "student") {
      return isPaid ? "/student/dashboard" : "/book-free-trial";
    }

    return "/";
  }
);
