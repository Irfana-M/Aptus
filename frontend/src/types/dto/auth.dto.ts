import type { User } from "../user.types";

export interface RegisterUserDto {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
  role: "student" | "mentor";
}

export interface VerifyOtpDto {
  email: string;
  otp: string;
}

export interface LoginDto {
  email: string;
  password: string;
  role: "student" | "mentor";
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  isProfileComplete?: boolean;
  isPaid?: boolean;
  hasPaid?: boolean;
  isTrialCompleted?: boolean;
}

export interface AdminLoginResponse {
  admin: {
    _id: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}
