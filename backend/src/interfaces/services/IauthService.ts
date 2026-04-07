import type { LoginUserDto } from "@/dtos/auth/LoginUserDTO";
import type { SendOtpDto } from "@/dtos/auth/OtpDTO";
import type { RegisterUserDto } from "@/dtos/auth/RegisteruserDTO";
import type { VerifyOtpDto } from "@/dtos/auth/VerifyOtpDTO";
import type { AuthUser } from "../auth/auth.interface";

export interface UserContextResponse {
  user: AuthUser;
  isProfileComplete: boolean;
  isPaid?: boolean;
  isTrialCompleted?: boolean;
}

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
    isTrialCompleted?: boolean;
    approvalStatus?: "pending" | "approved" | "rejected";
  }>;

  sendForgotPasswordOtp(data: SendOtpDto): Promise<void>;
  
  findUserByEmail(email: string): Promise<AuthUser | null>;
  
  getUserById(id: string, role: string): Promise<UserContextResponse>;
}
