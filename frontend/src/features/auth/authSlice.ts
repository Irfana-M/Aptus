import { createSlice } from "@reduxjs/toolkit";
import type { AuthState } from "../../types/auth.types";
import {
  registerUser,
  verifyOtp,
  resendOtp,
  logoutUser,
  loginUser,
  refreshAccessToken,
} from "./authThunks";
import { fetchStudentProfile } from "../student/studentThunk";
import { adminLoginThunk } from "../admin/adminThunk";

const storedToken =
  localStorage.getItem("student_accessToken") ||
  localStorage.getItem("mentor_accessToken") ||
  localStorage.getItem("accessToken");

let initialUser = null;
if (storedToken) {
  try {
    const payload = JSON.parse(atob(storedToken.split('.')[1]));
    const storedUserId = localStorage.getItem("userId") || payload.id;
    initialUser = {
      id: storedUserId,
      _id: storedUserId,
      email: payload.email || '',
      role: payload.role || localStorage.getItem("userRole"),
      isProfileComplete: localStorage.getItem("isProfileComplete") === "true",
      hasPaid: localStorage.getItem("hasPaid") === "true",
      isTrialCompleted: localStorage.getItem("isTrialCompleted") === "true",
      fullName: payload.email ? payload.email.split('@')[0] : '',
      onboardingStatus: 'registered' as any,
      phoneNumber: '',
      isVerified: false
    };
  } catch (e) {
    console.error("Failed to parse token for initial state", e);
  }
}

const initialState: AuthState = {
  loading: false, // We have the user synchronously, no need to show loading screen
  user: initialUser,
  accessToken: storedToken,
  error: null,
  isVerified: false,
  isAuthenticated: !!initialUser,
  isProfileComplete: localStorage.getItem("isProfileComplete") === "true" ? true : undefined,
  hasPaid: localStorage.getItem("hasPaid") === "true" ? true : undefined,
  isTrialCompleted: localStorage.getItem("isTrialCompleted") === "true" ? true : undefined,
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
      const { user, accessToken, role, isProfileComplete, hasPaid, isTrialCompleted } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      
      const targetRole = role || user?.role;
      if (targetRole === "student") {
        localStorage.setItem("student_accessToken", accessToken);
      } else if (targetRole === "mentor") {
        localStorage.setItem("mentor_accessToken", accessToken);
      } else {
        localStorage.setItem("accessToken", accessToken);
      }

      state.isAuthenticated = true;
      state.isProfileComplete = isProfileComplete;
      state.hasPaid = hasPaid;
      state.isTrialCompleted = isTrialCompleted;
      state.loading = false;
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
    initAuthFromStorage: (state) => {
      // Find the best available token
      const token = 
        localStorage.getItem("student_accessToken") || 
        localStorage.getItem("mentor_accessToken") || 
        localStorage.getItem("accessToken");
        
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const storedUserId = localStorage.getItem("userId") || payload.id;
          
          state.user = {
            id: storedUserId,
            _id: storedUserId,
            email: payload.email || '',
            role: payload.role || localStorage.getItem("userRole"),
            isProfileComplete: localStorage.getItem("isProfileComplete") === "true",
            hasPaid: localStorage.getItem("hasPaid") === "true",
            isTrialCompleted: localStorage.getItem("isTrialCompleted") === "true",
            fullName: payload.email ? payload.email.split('@')[0] : '',
            onboardingStatus: 'registered', // Default fallback, will be overwritten by student profile fetch
            phoneNumber: '',
            isVerified: false
          };
          state.accessToken = token;
          state.isAuthenticated = true;
          state.isProfileComplete = localStorage.getItem("isProfileComplete") === "true" ? true : undefined;
          state.hasPaid = localStorage.getItem("hasPaid") === "true" ? true : undefined;
          state.isTrialCompleted = localStorage.getItem("isTrialCompleted") === "true" ? true : undefined;
        } catch (e) {
          console.error("Failed to parse token for Redux hydration", e);
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

        // Persist token
        const role = action.payload.user?.role;
        if (role === "student") {
          localStorage.setItem("student_accessToken", action.payload.accessToken);
        } else if (role === "mentor") {
          localStorage.setItem("mentor_accessToken", action.payload.accessToken);
        } else {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
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

        // Persist token
        const role = action.payload.user?.role;
        if (role === "student") {
          localStorage.setItem("student_accessToken", action.payload.accessToken);
        } else if (role === "mentor") {
          localStorage.setItem("mentor_accessToken", action.payload.accessToken);
        } else {
          localStorage.setItem("accessToken", action.payload.accessToken);
        }
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        console.log("❌ refreshAccessToken rejected");
        state.loading = false;
        
        // Double-check if the interceptors explicitly wiped the token (401/403)
        const stillHasToken = !!(
           localStorage.getItem("student_accessToken") || 
           localStorage.getItem("mentor_accessToken") || 
           localStorage.getItem("accessToken")
        );
        
        if (!stillHasToken) {
          console.log("⚠️ Clearing auth state (Unauthenticated)");
          state.user = null;
          state.isAuthenticated = false;
        } else {
          console.warn("🛡️ Preserving active session despite network/server refresh failure");
        }
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
      })
      .addCase(fetchStudentProfile.fulfilled, (state, action) => {
        // Synchronize auth state with student profile
        if (action.payload) {
          const isComplete = action.payload.isProfileCompleted ?? action.payload.isProfileComplete;
          
          if (state.user) {
             state.user = {
              ...state.user,
              ...action.payload,
              isProfileComplete: isComplete,
              onboardingStatus: action.payload.onboardingStatus,
              hasPaid: action.payload.hasPaid
            };
          }
          
          state.isProfileComplete = isComplete;
          state.hasPaid = action.payload.hasPaid;
          state.isTrialCompleted = action.payload.isTrialCompleted;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { logout, clearError, setCredentials, updateProfileStatus, updatePaymentStatus, initAuthFromStorage } = authSlice.actions;
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
