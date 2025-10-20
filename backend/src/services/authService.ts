import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import type { IEmailService } from "../interfaces/services/IEmailService.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { IMentorAuthRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { LoginUserDto } from "../dto/LoginUserDTO.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import { hashPassword, comparePasswords } from "../utils/password.utils.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import type { IAuthService } from "../interfaces/services/IauthService.js";
import type { AuthUser, MentorAuthUser, StudentAuthUser } from "../interfaces/auth/auth.interface.js";
import type { IProfileService } from "../interfaces/services/IProfileService.js";
import { logger } from "../utils/logger.js";

export class AuthService implements IAuthService {
  constructor(
    private _authRepo: IAuthRepository,
    private _otpService: IOtpService,
    private _emailService: IEmailService,
    private _studentRepo: IStudentRepository,
    private _mentorRepo: IMentorAuthRepository,
    private _profileService: IProfileService
  ) {}

  async registerUser(data: RegisterUserDto) {
    try {
      const existingUser = await this._authRepo.findByEmail(data.email);
      if (existingUser) throw new Error("User already exists");

      if (data.password !== data.confirmPassword) throw new Error("Passwords do not match");

      const hashedPassword = await hashPassword(data.password);
      const user = await this._authRepo.createUser({ ...data, password: hashedPassword });

      await this.sendSignupOtp(user.email, data.role);

      logger.info(`User registered successfully: ${data.email}, role: ${data.role}`);
      return { message: "User registered. Please verify your email" };
    } catch (error: any) {
      logger.error(`User registration failed: ${data.email} - ${error.message}`);
      throw error;
    }
  }

  async sendSignupOtp(email: string, role: "student" | "mentor"): Promise<void> {
    try {
      await this._otpService.generateAndSaveOtp(
        email,
        "signup",
        "email",
        new Date(Date.now() + 10 * 60 * 1000),
        role
      );
      logger.info(`Signup OTP sent to: ${email}, role: ${role}`);
    } catch (error: any) {
      logger.error(`Failed to send signup OTP to ${email} - ${error.message}`);
      throw error;
    }
  }

  async verifySignupOtp(email: string, otp: string) {
    try {
      const savedOtp = await this._otpService.verifyOtp(email, "signup", otp);
      if (!savedOtp) throw new Error("Invalid or expired OTP");

      const role = savedOtp.role ?? (await this._authRepo.findByEmail(email))?.role;
      if (!role) throw new Error("Cannot determine user role");

      await (role === "student"
        ? this._studentRepo.markUserVerified(email)
        : this._mentorRepo.markUserVerified(email));

      await this._emailService.sendMail(
        email,
        "Welcome to Mentora",
        `<p>Your account has been verified successfully!</p>`
      );

      logger.info(`User verified successfully: ${email}, role: ${role}`);
      return true;
    } catch (error: any) {
      logger.error(`Signup verification failed for ${email} - ${error.message}`);
      throw error;
    }
  }

  async loginUser({ email, password, role }: LoginUserDto): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    isProfileComplete: boolean;
    isPaid?: boolean;
  }> {
    try {
      const repo = role === "student" ? this._studentRepo : this._mentorRepo;
      const user = await repo.findByEmail(email);
      if (!user) throw new Error("User not found");

      const isMatch = await comparePasswords(password, user.password);
      if (!isMatch) throw new Error("Invalid credentials");

      const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });
      const refreshToken = generateRefreshToken({ id: user._id, email: user.email, role: user.role });

      let isProfileComplete = false;
      let isPaid: boolean | undefined = undefined;

      if (role === "mentor") {
        isProfileComplete = this._profileService.isMentorProfileComplete(user as MentorAuthUser);
      } else {
        isPaid = Boolean((user as StudentAuthUser).isPaid);
        isProfileComplete = true;
      }

      const userResponse: AuthUser = {
        _id: user._id,
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        password: user.password,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete,
      };

      const result: {
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
      isProfileComplete: boolean;
      isPaid?: boolean;
    } = { user: userResponse, accessToken, refreshToken, isProfileComplete };

    if (isPaid !== undefined) {
      result.isPaid = isPaid;
    }

      logger.info(`User login success: ${email}, role: ${role}`);
      return result;
    } catch (error: any) {
      logger.error(`User login failed: ${email} - ${error.message}`);
      throw error;
    }
  }

  async markUserAsVerified(email: string, role: "student" | "mentor") {
    try {
      if (role === "student") await this._studentRepo.markUserVerified(email);
      else await this._mentorRepo.markUserVerified(email);
      logger.info(`User marked verified: ${email}, role: ${role}`);
    } catch (error: any) {
      logger.error(`Failed to mark user verified: ${email} - ${error.message}`);
      throw error;
    }
  }

  async sendForgotPasswordOtp(email: string, role: "student" | "mentor"): Promise<void> {
    try {
      const repo = role === "student" ? this._studentRepo : this._mentorRepo;
      const user = await repo.findByEmail(email);
      if (!user) throw new Error(`No ${role} account found with this email`);

      await this._otpService.generateAndSaveOtp(email, "forgotPassword", "email", new Date(Date.now() + 10 * 60 * 1000), role);
      logger.info(`Forgot password OTP sent to: ${email}, role: ${role}`);
    } catch (error: any) {
      logger.error(`Failed to send forgot password OTP: ${email} - ${error.message}`);
      throw error;
    }
  }

  async resetPassword(email: string, otp: string, password: string, confirmPassword: string): Promise<void> {
    try {
      if (password !== confirmPassword) throw new Error("Passwords do not match");

      const verifiedOtp = await this._otpService.verifyOtp(email, "forgotPassword", otp);
      if (!verifiedOtp) throw new Error("Invalid or expired OTP");

      const hashedPassword = await hashPassword(password);
      await this._authRepo.updatePassword(email, hashedPassword);

      logger.info(`Password reset successful: ${email}`);
    } catch (error: any) {
      logger.error(`Password reset failed: ${email} - ${error.message}`);
      throw error;
    }
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const user = await this._authRepo.findByEmail(email);
      logger.info(`Fetched user by email: ${email}`);
      return user;
    } catch (error: any) {
      logger.error(`Failed to fetch user by email: ${email} - ${error.message}`);
      throw error;
    }
  }
}
