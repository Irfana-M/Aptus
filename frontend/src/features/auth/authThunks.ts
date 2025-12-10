import { createAsyncThunk } from "@reduxjs/toolkit";
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
  { accessToken: string },
  void,
  { rejectValue: string }
>("auth/refreshToken", async (_, { rejectWithValue }) => {
  try {
    const res = await authApi.refreshToken();
    return res.data;
  } catch (err: unknown) {
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
      return {
        user: {
          ...user,
          isProfileComplete,
          isPaid,
          isTrialCompleted,
        },
        accessToken,
        isProfileComplete,
        isPaid,
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
      dispatch(logout());

      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("signupEmail");
    }
  }
);
