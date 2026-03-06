import api from "../../api/api";
import type { ApiResponse } from "../../types/api.types";
import { API_ROUTES } from "../../constants/apiRoutes";
import type {
  RegisterUserDto,
  VerifyOtpDto,
  LoginDto,
  LoginResponse,
} from "../../types/dto/auth.dto";
import type { User } from "../../types/user.types";

export const authApi = {
  register: (data: RegisterUserDto) => api.post<ApiResponse<User>>(API_ROUTES.AUTH.SIGNUP, data),
  verifyOtp: (data: VerifyOtpDto) =>
    api.post<ApiResponse<{ message: string }>>(API_ROUTES.AUTH.VERIFY_OTP, data),
  resendOtp: (email: string) =>
    api.post<ApiResponse<{ message: string }>>(API_ROUTES.AUTH.RESEND_OTP, { email }),
  login: (data: LoginDto) => api.post<ApiResponse<LoginResponse>>(API_ROUTES.AUTH.LOGIN, data),
  logout: () => api.post<ApiResponse<{ message: string }>>(API_ROUTES.AUTH.LOGOUT),
  refreshToken: () => api.post<ApiResponse<LoginResponse>>(API_ROUTES.AUTH.REFRESH, {}),
};
