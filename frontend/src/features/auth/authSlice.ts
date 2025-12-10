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

const initialState: AuthState = {
  loading: false,
  user: null,
  accessToken: null,
  error: null,
  isVerified: false,
  isAuthenticated: false,
  isProfileComplete: undefined,
  isPaid: undefined,
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
      state.isPaid = undefined;
      state.isTrialCompleted = undefined;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { user, accessToken, isProfileComplete, isPaid, isTrialCompleted } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.isProfileComplete = isProfileComplete;
      state.isPaid = isPaid;
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
      state.isPaid = action.payload.isPaid;
      if (state.user) {
        state.user.isPaid = action.payload.isPaid;
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
        state.isPaid = action.payload.isPaid;
        state.isTrialCompleted = action.payload.isTrialCompleted;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isProfileComplete = undefined;
        state.isPaid = undefined;
        state.isTrialCompleted = undefined;
      })
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.accessToken = null;
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isVerified = false;
        state.error = null;
        state.loading = false;
        state.accessToken = null;
        state.isAuthenticated = false;
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
export const selectIsPaid = (state: { auth: AuthState }) => state.auth.isPaid;
