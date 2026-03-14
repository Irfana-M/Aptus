import { createAsyncThunk } from "@reduxjs/toolkit";
import * as Sentry from "@sentry/react";
import { store, type RootState } from "../../app/store";
import { authApi } from "./authApi";
import type {
  RegisterUserDto,
  VerifyOtpDto,
  LoginDto,
  LoginResponse,
} from "../../types/dto/auth.dto";
import type { User } from "../../types/user.types";
import { logout } from "./authSlice";
import { getApiErrorMessage } from "../../utils/errorUtils";
import socketService from "../../services/socketService";
import { TokenManager } from "../../utils/tokenManager";

export const registerUser = createAsyncThunk<User, RegisterUserDto>(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authApi.register(data);
      return res.data.data;
    } catch (err: unknown) {
      return rejectWithValue(
        getApiErrorMessage(err, "Registration failed")
      );
    }
  }
);

export const verifyOtp = createAsyncThunk<void, VerifyOtpDto>(
  "auth/verifyOtp",
  async (data, { rejectWithValue }) => {
    try {
      await authApi.verifyOtp(data);
    } catch (err: unknown) {
      return rejectWithValue(
        getApiErrorMessage(err, "OTP verification failed")
      );
    }
  }
);

export const resendOtp = createAsyncThunk<void, string>(
  "auth/resendOtp",
  async (email, { rejectWithValue }) => {
    try {
      await authApi.resendOtp(email);
    } catch (err: unknown) {
      return rejectWithValue(
        getApiErrorMessage(err, "Resend OTP failed")
      );
    }
  }
);

export const refreshAccessToken = createAsyncThunk<
  LoginResponse,
  void,
  { rejectValue: string }
>("auth/refreshToken", async (_, { rejectWithValue, getState }) => {
  const state = getState() as RootState;
  if (state.auth.loading) {
    return rejectWithValue("Refresh already in progress");
  }
  try {
    const res = await authApi.refreshToken();
    // Backend returns flat structure, contradicting ApiResponse type
    const { user, accessToken, isProfileComplete, isPaid, isTrialCompleted } = res.data as unknown as LoginResponse;

    Sentry.addBreadcrumb({
      category: "auth",
      message: "refreshAccessToken: SUCCESS — new token received",
      level: "info",
      data: {
        hasAccessToken: !!accessToken,
        userRole: user?.role,
        isProfileComplete,
        isPaid,
        isTrialCompleted,
      },
    });
    console.log("[refreshAccessToken] ✅ Refresh succeeded", { role: user?.role, hasToken: !!accessToken });

    if (accessToken && user.role) {
      TokenManager.setToken(user.role, accessToken);
    }
    return {
      user: {
        ...user,
        isProfileComplete,
        hasPaid: isPaid,
        isTrialCompleted,
      },
      accessToken,
      isProfileComplete,
      isPaid,
      hasPaid: isPaid,
      isTrialCompleted,
    };
  } catch (err: unknown) {
    // ONLY clear tokens if it's a definitive authentication failure (401/403)
    // and not a network error or potential race condition with a new login
    // @ts-ignore
    const errStatus = err?.response?.status;
    const isAuthError = errStatus === 401 || errStatus === 403;

    const hasToken = !!TokenManager.getAnyToken();
    const currentState = store.getState() as RootState;

    Sentry.captureMessage("refreshAccessToken: FAILED", {
      level: "warning",
      extra: {
        errorStatus: errStatus,
        isAuthError,
        reduxUserExists: !!currentState.auth.user,
        anyTokenInStorage: hasToken,
        studentToken: !!localStorage.getItem("student_accessToken"),
        mentorToken: !!localStorage.getItem("mentor_accessToken"),
        adminToken: !!localStorage.getItem("admin_accessToken"),
        userRole: localStorage.getItem("userRole"),
      },
    });
    console.warn("[refreshAccessToken] ❌ Refresh failed", {
      errStatus,
      isAuthError,
      reduxUserExists: !!currentState.auth.user,
      anyTokenInStorage: hasToken,
      studentToken: !!localStorage.getItem("student_accessToken"),
      mentorToken: !!localStorage.getItem("mentor_accessToken"),
      userRole: localStorage.getItem("userRole"),
    });

    if (isAuthError) {
      if (!currentState.auth.user && !hasToken) {
        console.warn("🔐 Refresh failed with 401. No active session, clearing tokens.");
        Sentry.addBreadcrumb({ category: "auth", message: "refreshAccessToken: WIPING tokens — no user + no token", level: "error" });
        TokenManager.clearAllTokens()

        const keys = [
          "userId",
          "isTrialCompleted",
          "hasPaid",
          "isProfileComplete"
        ];

        keys.forEach(key => localStorage.removeItem(key));
      } else {
        console.warn("🛡️ Refresh failed with 401 but an active session exists. Skipping token wipe.");
        Sentry.addBreadcrumb({ category: "auth", message: "refreshAccessToken: Skipped token wipe — session still active", level: "warning" });
      }
    }

    return rejectWithValue(
      getApiErrorMessage(err, "Token refresh failed")
    );
  }
});



export const loginUser = createAsyncThunk<
  LoginResponse,
  LoginDto,
  { rejectValue: string }
>(
  "auth/login",
  async (
    data,
    { rejectWithValue }
  ): Promise<LoginResponse | ReturnType<typeof rejectWithValue>> => {
    try {
      const res = await authApi.login(data);
      // Backend returns flat structure, contradicting ApiResponse type
      const { user, accessToken, isProfileComplete, isPaid, isTrialCompleted } = res.data as unknown as LoginResponse;

      Sentry.addBreadcrumb({
        category: "auth",
        message: "loginUser thunk: API response received",
        level: "info",
        data: {
          hasAccessToken: !!accessToken,
          hasUser: !!user,
          userRole: user?.role,
          userId: user?._id,
          isPaid,
          isProfileComplete,
          isTrialCompleted,
        },
      });
      console.log("[loginUser] ✅ API response received", {
        role: user?.role,
        hasToken: !!accessToken,
        isPaid,
        isProfileComplete,
        isTrialCompleted,
      });

      if (accessToken && user.role) {
        TokenManager.setToken(user.role, accessToken);
        localStorage.setItem("userId", user._id);

        Sentry.addBreadcrumb({
          category: "auth",
          message: "loginUser thunk: Token stored via TokenManager",
          level: "info",
          data: {
            storedRole: user.role,
            tokenKey: `${user.role}_accessToken`,
            tokenExistsAfterSet: !!localStorage.getItem(`${user.role}_accessToken`),
            userRoleInStorage: localStorage.getItem("userRole"),
          },
        });
        console.log("[loginUser] 🔑 Token stored", {
          key: `${user.role}_accessToken`,
          tokenExists: !!localStorage.getItem(`${user.role}_accessToken`),
          userRole: localStorage.getItem("userRole"),
        });
      } else {
        Sentry.captureMessage("loginUser thunk: Token NOT stored — missing accessToken or user.role", {
          level: "error",
          extra: { hasAccessToken: !!accessToken, userRole: user?.role },
        });
        console.error("[loginUser] ❌ Token NOT stored", { hasAccessToken: !!accessToken, userRole: user?.role });
      }

      return {
        user: {
          ...user,
          isProfileComplete,
          hasPaid: isPaid,
          isTrialCompleted,
        },
        accessToken,
        isProfileComplete,
        hasPaid: isPaid,
        isTrialCompleted,
      };
    } catch (err: unknown) {
      return rejectWithValue(getApiErrorMessage(err, "Login failed"));
    }
  }
);

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await authApi.logout?.();
    } catch (err) {
      console.error("Backend logout failed", err);
    } finally {
      // Disconnect realtime connections
      socketService.disconnect();

      // Clear tokens using TokenManager
      TokenManager.clearAllTokens();

      // Clear other session data
      const sharedKeys = [
        "userId",
        "isTrialCompleted",
        "isProfileComplete",
        "hasPaid"
      ];

      sharedKeys.forEach(key => localStorage.removeItem(key));

      sessionStorage.clear();

      // Reset redux state
      dispatch(logout());
    }
  }
);
