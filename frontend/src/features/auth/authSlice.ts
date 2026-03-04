import { createSlice } from "@reduxjs/toolkit";
import type { AuthState } from "../../types/authTypes";
import {
  registerUser,
  verifyOtp,
  resendOtp,
  logoutUser,
  loginUser,
  refreshAccessToken,
} from "./authThunks";
import { adminLoginThunk } from "../admin/adminThunk";

const hasToken = !!(
  localStorage.getItem("student_accessToken") || 
  localStorage.getItem("mentor_accessToken") || 
  localStorage.getItem("accessToken")
);

const initialState: AuthState = {
  loading: hasToken, // Initialize as loading if we have a token to rehydrate
  user: null,
  accessToken: null,
  error: null,
  isVerified: false,
  isAuthenticated: false,
  isProfileComplete: undefined,
  hasPaid: undefined,
  isTrialCompleted: undefined,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isVerified = false;
      state.error = null;
      state.loading = false;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isProfileComplete = undefined;
      state.hasPaid = undefined;
      state.isTrialCompleted = undefined;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, accessToken, isProfileComplete, hasPaid, isTrialCompleted } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.isProfileComplete = isProfileComplete;
      state.hasPaid = hasPaid;
      state.isTrialCompleted = isTrialCompleted;
      state.error = null;
    },
    updateProfileStatus: (state, action) => {
      state.isProfileComplete = action.payload.isProfileComplete;
      if (state.user) {
        state.user.isProfileComplete = action.payload.isProfileComplete;
      }
    },
    updatePaymentStatus: (state, action) => {
      state.hasPaid = action.payload.hasPaid;
      if (state.user) {
        state.user.hasPaid = action.payload.hasPaid;
        // Immediately set the onboarding status so guards work before profile fetch
        if (action.payload.hasPaid) {
          state.user.onboardingStatus = 'subscribed';
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyOtp.fulfilled, (state) => {
        state.isVerified = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.isProfileComplete = action.payload.isProfileComplete;
        state.hasPaid = action.payload.hasPaid;
        state.isTrialCompleted = action.payload.isTrialCompleted;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isProfileComplete = undefined;
        state.hasPaid = undefined;
        state.isTrialCompleted = undefined;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.loading = false;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.isProfileComplete = action.payload.isProfileComplete;
        state.hasPaid = action.payload.hasPaid;
        state.isTrialCompleted = action.payload.isTrialCompleted;
        state.error = null;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.loading = false;
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isVerified = false;
        state.isProfileComplete = undefined;
        state.hasPaid = undefined;
        state.isTrialCompleted = undefined;
        state.error = null;
      })
      .addCase(adminLoginThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isProfileComplete = undefined;
        state.hasPaid = undefined;
        state.isTrialCompleted = undefined;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userRole");
      });
  },
});

export const { logout, clearError, setCredentials, updateProfileStatus, updatePaymentStatus } = authSlice.actions;
export default authSlice.reducer;
export const selectCurrentToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectIsProfileComplete = (state: { auth: AuthState }) =>
  state.auth.isProfileComplete;
export const selectHasPaid = (state: { auth: AuthState }) => state.auth.hasPaid;
export const selectUser = selectCurrentUser;
