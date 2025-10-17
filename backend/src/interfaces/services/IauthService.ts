import type { LoginUserDto } from "../../dto/LoginUserDTO.js";
import type { RegisterUserDto } from "../../dto/RegisteruserDTO.js";
import type { AuthUser } from "../auth/auth.interface.js";
export interface IAuthService {
  registerUser(data: RegisterUserDto): Promise<{ message: string }>;
  sendSignupOtp(email: string, role: "student" | "mentor"): Promise<void>;
  verifySignupOtp(
    otp: string,
    email: string,
    role: "student" | "mentor"
  ): Promise<boolean>;
  markUserAsVerified(email: string, role: "student" | "mentor"): Promise<void>;
  loginUser(data: LoginUserDto): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }>;
  sendForgotPasswordOtp(email: string, role: "student" | "mentor"): Promise<void>;
  resetPassword(
    email: string,
    otp: string,
    password: string,
    confirmPassword: string
  ): Promise<void>;
  findUserByEmail(email: string): Promise<AuthUser | null>
}
