import api from "../../api/api";
import type {
  RegisterUserDto,
  VerifyOtpDto,
  LoginDto,
  LoginResponse,
} from "../../types/dtoTypes";
import type { User } from "../../types/authTypes";

export const authApi = {
  register: (data: RegisterUserDto) => api.post<User>("/auth/signup", data),
  verifyOtp: (data: VerifyOtpDto) =>
    api.post<{ message: string }>("/auth/signup/verify-otp", data),
  resendOtp: (email: string) =>
    api.post<{ message: string }>("/auth/signup/resend-otp", { email }),
  login: (data: LoginDto) => api.post<LoginResponse>("/auth/login", data),
  logout: () => api.post<{ message: string }>("/auth/logout"),
  refreshToken: () => api.post<{ accessToken: string }>("/auth/refresh", {}),
};
