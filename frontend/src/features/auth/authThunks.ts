import { createAsyncThunk } from "@reduxjs/toolkit";
import { store, type RootState } from "../../app/store";
import { authApi } from "./authApi";
import type {
  RegisterUserDto,
  VerifyOtpDto,
  LoginDto,
  LoginResponse,
} from "../../types/dtoTypes";
import type { User } from "../../types/authTypes";
import { logout } from "./authSlice";
import { getApiErrorMessage } from "../../utils/errorUtils";

export const registerUser = createAsyncThunk<User, RegisterUserDto>(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authApi.register(data);
      return res.data;
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
> ("auth/refreshToken", async (_, { rejectWithValue, getState }) => {
  const state = getState() as RootState;
  if (state.auth.loading) {
      return rejectWithValue("Refresh already in progress");
  }
  try {
    const res = await authApi.refreshToken();
    const { user, accessToken, isProfileComplete, isPaid, isTrialCompleted } = res.data;
    
    if (accessToken && user.role) {
        localStorage.setItem(`${user.role}_accessToken`, accessToken);
        localStorage.setItem("userRole", user.role);
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
    // Determine role to clear specifically
    const state = store.getState() as RootState;
    const role = state.auth.user?.role;
    
    if (role) {
      localStorage.removeItem(`${role}_accessToken`);
    } else {
      // Fallback: try to find which one failed if multiple exist (discovery)
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userRole");
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
      const { user, accessToken, isProfileComplete, isPaid, isTrialCompleted } = res.data;
      
      if (accessToken && user.role) {
          localStorage.setItem(`${user.role}_accessToken`, accessToken);
          localStorage.setItem("userRole", user.role);
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
    } catch (err: unknown) {
      console.error("Backend logout failed", err);
    } finally {

      
      const state = store.getState() as RootState;
      const role = state.auth.user?.role;
      
      dispatch(logout());
      
      if (role) {
          localStorage.removeItem(`${role}_accessToken`);
      }
      
      // Clear shared user state but NOT admin state
      const sharedKeys = [
        "accessToken",
        "userRole",
        "userId",
        "isTrialCompleted",
        "isProfileComplete",
        "hasPaid"
      ];
      sharedKeys.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();
    }
  }
);
