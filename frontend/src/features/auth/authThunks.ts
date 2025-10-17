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

export const registerUser = createAsyncThunk<User, RegisterUserDto>(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const res = await authApi.register(data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Registration failed"
      );
    }
  }
);

export const verifyOtp = createAsyncThunk<void, VerifyOtpDto>(
  "auth/verifyOtp",
  async (data, { rejectWithValue }) => {
    try {
      await authApi.verifyOtp(data);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "OTP verification failed"
      );
    }
  }
);

export const resendOtp = createAsyncThunk<void, string>(
  "auth/resendOtp",
  async (email, { rejectWithValue }) => {
    try {
      await authApi.resendOtp(email);
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.message || "Resend OTP failed"
      );
    }
  }
);

export const refreshAccessToken = createAsyncThunk<{ accessToken: string}, void, { rejectValue: string }>(
  "auth/refreshToken",
  async (_,{ rejectWithValue }) => {
    try {
      const res = await authApi.refreshToken();
      return res.data;

    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Token refresh failed");
    }
  }

);

export const loginUser = createAsyncThunk<LoginResponse, LoginDto, { rejectValue: string }>(
  "auth/login",
  async (data, { rejectWithValue }): Promise<LoginResponse | ReturnType<typeof rejectWithValue>>  => {
    try {
      const res = await authApi.login(data);
      const { user, accessToken, isProfileComplete, isPaid } = res.data;
      return { user: {
          ...user,
          isProfileComplete,
          isPaid
        },
        accessToken,
        isProfileComplete,
        isPaid
      };

    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || "Login failed");
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
      dispatch(logout());

      localStorage.removeItem("token");
      localStorage.removeItem("signupEmail");
    }
  }
);
