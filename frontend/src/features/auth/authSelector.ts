import type { RootState } from "../../app/store";
import { createSelector } from "@reduxjs/toolkit";

export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsVerified = (state: RootState) => state.auth.isVerified;
export const selectIsProfileComplete = (state: RootState) =>
  state.auth.isProfileComplete;
export const selectHasPaid = (state: RootState) => state.auth.hasPaid;

export const selectUserRole = createSelector(
  [selectCurrentUser],
  (user) => user?.role
);

export const selectRedirectPath = createSelector(
  [selectCurrentUser, selectIsProfileComplete, selectHasPaid],
  (user, isProfileComplete, hasPaidState) => {
    if (!user) return "/login";

    if (user.role === "mentor") {
      return isProfileComplete ? "/mentor/dashboard" : "/mentor/profile-setup";
    }

    if (user.role === "student") {
      const studentUser = user as { isTrialCompleted?: boolean; isProfileComplete?: boolean; hasPaid?: boolean };
      const isTrialCompleted = studentUser.isTrialCompleted;
      const isStudentProfileComplete = studentUser.isProfileComplete;
      const hasPaid = studentUser.hasPaid || hasPaidState;
      
      if (hasPaid) return "/student/dashboard";
      if (!isTrialCompleted) return "/student/book-free-trial";
      if (!isStudentProfileComplete) return "/student/profile-setup";
      return "/student/dashboard";
    }

    return "/";
  }
);
