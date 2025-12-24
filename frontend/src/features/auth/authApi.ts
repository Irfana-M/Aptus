import api from "../../api/api";
import { API_ROUTES } from "../../constants/apiRoutes";
import type {
  RegisterUserDto,
  VerifyOtpDto,
  LoginDto,
  LoginResponse,
} from "../../types/dtoTypes";
import type { User } from "../../types/authTypes";

export const authApi = {
  register: (data: RegisterUserDto) => api.post<User>(API_ROUTES.AUTH.SIGNUP, data),
  verifyOtp: (data: VerifyOtpDto) =>
    api.post<{ message: string }>(API_ROUTES.AUTH.VERIFY_OTP, data),
  resendOtp: (email: string) =>
    api.post<{ message: string }>(API_ROUTES.AUTH.RESEND_OTP, { email }),
  login: (data: LoginDto) => api.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, data),
  logout: () => api.post<{ message: string }>(API_ROUTES.AUTH.LOGOUT),
  refreshToken: () => api.post<LoginResponse>(API_ROUTES.AUTH.REFRESH, {}),
};
