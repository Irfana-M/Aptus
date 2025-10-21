import type { ForgotPasswordDto } from "../../dto/forgotPassword.dto.js";
import type { LoginUserDto } from "../../dto/LoginUserDTO.js";
import type { SendOtpDto } from "../../dto/otp.dto.js";
import type { RegisterUserDto } from "../../dto/RegisteruserDTO.js";
import type { VerifyOtpDto } from "../../dto/VerifyOtpDTO.js";
import type { AuthUser } from "../auth/auth.interface.js";

export interface IAuthService {
  registerUser(data: RegisterUserDto): Promise<{ message: string }>;

  sendSignupOtp(data: SendOtpDto): Promise<void>;

  verifySignupOtp(data: VerifyOtpDto): Promise<boolean>;

  markUserAsVerified(data: SendOtpDto): Promise<void>;

  loginUser(data: LoginUserDto): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    isProfileComplete?: boolean;
    isPaid?: boolean | undefined;
  }>;

  sendForgotPasswordOtp(data: SendOtpDto): Promise<void>;

  resetPassword(data: ForgotPasswordDto): Promise<void>;

  findUserByEmail(email: string): Promise<AuthUser | null>;
}
