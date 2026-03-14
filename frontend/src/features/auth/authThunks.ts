import { createAsyncThunk } from "@reduxjs/toolkit";
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

    if (isAuthError) {
      const hasToken = !!TokenManager.getAnyToken();
      const currentState = store.getState() as RootState;
      if (!currentState.auth.user && !hasToken) {
        console.warn("🔐 Refresh failed with 401. No active session, clearing tokens.");
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

      if (accessToken && user.role) {
        TokenManager.setToken(user.role, accessToken);
        localStorage.setItem("userId", user._id);
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
