import type { IAuthRepository } from "../interfaces/auth/IAuthRepository";
import type { IOtpService } from "../interfaces/services/IOtpService";
import type { IEmailService } from "../interfaces/services/IEmailService";
import type { IStudentAuthRepository } from "../interfaces/repositories/IStudentAuthRepository";
import type { IMentorAuthRepository } from "../interfaces/repositories/IMentorAuthRepository";
import type { LoginUserDto } from "../dto/auth/LoginUserDTO";
import type { RegisterUserDto } from "../dto/auth/RegisteruserDTO";
import { hashPassword, comparePasswords } from "../utils/password.utils";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";
import type { IAuthService, UserContextResponse } from "../interfaces/services/IauthService";
import type {
  AuthUser,
  MentorAuthUser,
  StudentAuthUser,
} from "../interfaces/auth/auth.interface";
import type { IProfileService } from "../interfaces/services/IProfileService";
import { logger } from "../utils/logger";
import type { SendOtpDto } from "../dto/auth/OtpDTO";
import type { VerifyOtpDto } from "../dto/auth/VerifyOtpDTO";
// ForgotPasswordDto import removed as it is unused
import type {
  MentorBaseResponseDto,
  StudentBaseResponseDto,
} from "@/dto/auth/UserResponseDTO";
import { UserMapper } from "@/mappers/userMapper";
import { HttpStatusCode } from "@/constants/httpStatus";
import { AppError } from "@/utils/AppError";
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IWalletService } from "../interfaces/services/IWalletService";
import * as crypto from 'crypto';

// ... (existing imports)

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(TYPES.IAuthRepository) private _authRepo: IAuthRepository,
    @inject(TYPES.IOtpService) private _otpService: IOtpService,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
    @inject(TYPES.IStudentAuthRepository) private _studentRepo: IStudentAuthRepository,
    @inject(TYPES.IMentorAuthRepository) private _mentorRepo: IMentorAuthRepository,
    @inject(TYPES.IProfileService) private _profileService: IProfileService,
    @inject(TYPES.IWalletService) private _walletService: IWalletService
  ) {}

  async registerUser(data: RegisterUserDto) {
    try {
      const existingUser = await this._authRepo.findByEmail(data.email);
      if (existingUser) throw new Error("User already exists");

      if (data.password !== data.confirmPassword)
        throw new Error("Passwords do not match");

      const hashedPassword = await hashPassword(data.password);
      
      // Generate unique referral code for the new user
      const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      // Handle referral usage (if new user signed up with a code)
      let referredBy = undefined;
      // Note: Data is typed as RegisterUserDto which has referralCode
      const inputRefCode = data.referralCode;

      if (inputRefCode && data.role === 'student') {
         const referrer = await this._studentRepo.findByReferralCode(inputRefCode);
         if (referrer) {
            referredBy = referrer.referralCode;
            // Credit the referrer - amount configurable, e.g., 100
             // We can do this async or await. Await ensures reliability.
             // Usually credit should happen ONLY after verification, but per user request 
             // "credit referrer when new user signs up", we do it here or after verify.
             // Safest is after verification (verifySignupOtp), but user said "Signs Up". 
             // "Signs Up" usually implies successful registration.
             // Let's defer actual credit to 'verifySignupOtp' to prevent spam/fake accounts 
             // from draining budget, OR do it here if "Sign Up" means just filling form.
             // Recommendation: Do it on Verification. 
             // But to follow user instruction "Signs Up", I will store 'referredBy' now 
             // and credit in 'verifySignupOtp'.
         }
      }

      const userData: RegisterUserDto = {
        ...data,
        password: hashedPassword,
        referralCode: newReferralCode,
      };

      if (referredBy) {
          userData.referredBy = referredBy;
      }

      const user = await this._authRepo.createUser(userData);

      // Initialize empty wallet for the new student
      if (data.role === 'student') {
        await this._walletService.createWallet(user._id);
      }

      await this.sendSignupOtp({ email: user.email, role: data.role });

      logger.info(
        `User registered successfully: ${data.email}, role: ${data.role}`
      );
      return { message: "User registered. Please verify your email" };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `User registration failed: ${data.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async sendSignupOtp(data: SendOtpDto): Promise<void> {
    try {
      await this._otpService.generateAndSaveOtp(
        data.email,
        "signup",
        "email",
        new Date(Date.now() + 10 * 60 * 1000),
        data.role
      );
      logger.info(`Signup OTP sent to: ${data.email}, role: ${data.role}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to send signup OTP to ${data.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async verifySignupOtp(data: VerifyOtpDto) {
    try {
      const savedOtp = await this._otpService.verifyOtp(
        data.email,
        "signup",
        data.otp
      );
      if (!savedOtp) throw new Error("Invalid or expired OTP");

      const role =
        savedOtp.role ?? (await this._authRepo.findByEmail(data.email))?.role;
      if (!role) throw new Error("Cannot determine user role");

      await (role === "student"
        ? this._studentRepo.markUserVerified(data.email)
        : this._mentorRepo.markUserVerified(data.email));

      // NEW: Credit Referral Bonus here to prevent spam
      if (role === 'student') {
          const student = await this._studentRepo.findByEmail(data.email);
          if (student && (student as unknown as { referredBy?: string }).referredBy) {
             const referrer = await this._studentRepo.findByReferralCode((student as unknown as { referredBy?: string }).referredBy!);
             if (referrer) {
                // Credit Referrer
                await this._walletService.creditWallet(
                    referrer._id, 
                    100, // Reward Amount
                    'REFERRAL', 
                    `Referral bonus for inviting ${student.email}`
                );
                logger.info(`Referral bonus credited to ${referrer.email} for invoking ${student.email}`);
             }
          }
      }

      await this._emailService.sendMail(
        data.email,
        "Welcome to Aptus",
        `<p>Your account has been verified successfully!</p>`
      );

      logger.info(`User verified successfully: ${data.email}, role: ${role}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Signup verification failed for ${data.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async loginUser({ email, password, role }: LoginUserDto): Promise<{
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
    isProfileComplete: boolean;
    isPaid?: boolean;
    isTrialCompleted?: boolean;
  }> {
    try {
      const repo = role === "student" ? this._studentRepo : this._mentorRepo;
      const user = await repo.findByEmail(email);
      if (!user) throw new AppError("User not found", HttpStatusCode.NOT_FOUND);

      if (!user.password) {
        throw new AppError(
          "Invalid credentials - authentication method not supported",
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const isMatch = await comparePasswords(password, user.password);
      if (!isMatch)
        throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED);

      const accessToken = generateAccessToken({
        id: user._id,
        email: user.email,
        role: user.role,
      });
      const refreshToken = generateRefreshToken({
        id: user._id,
        email: user.email,
        role: user.role,
      });

      let isProfileComplete = false;
      let isPaid: boolean | undefined = undefined;
      let isTrialCompleted: boolean | undefined = undefined;

      if (role === "mentor") {
        isProfileComplete = this._profileService.isMentorProfileComplete(
          user as MentorAuthUser
        );
      } else {
        const studentUser = user as StudentAuthUser;
        isPaid = Boolean(studentUser.isPaid);
        isProfileComplete = Boolean(studentUser.isProfileCompleted);
        isTrialCompleted = Boolean(studentUser.isTrialCompleted);

        // Self-healing: If flag is false but user might have completed a trial
        if (!isTrialCompleted) {
          try {
            const { TrialClass } = await import("@/models/student/trialClass.model");
            const { StudentModel } = await import("@/models/student/student.model");
            
            const completedTrial = await TrialClass.findOne({
              student: user._id,
              status: 'completed'
            });

            if (completedTrial) {
              logger.info(`🩹 Self-healing: Found completed trial for ${email}, updating flag.`);
              await StudentModel.findByIdAndUpdate(user._id, { isTrialCompleted: true });
              isTrialCompleted = true;
            }
          } catch (healingError) {
            logger.error("Self-healing check failed:", healingError as Error);
          }
        }

      }

      const userResponse: AuthUser = UserMapper.toLoginAuthUser(
        user as MentorAuthUser | StudentAuthUser,
        isProfileComplete
      );
      
      if (role === 'mentor') {
           const mentorUser = user as MentorAuthUser;
           if (mentorUser.approvalStatus) {
               userResponse.approvalStatus = mentorUser.approvalStatus;
           }
      }
      
      const result: {
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
        isProfileComplete: boolean;
        isPaid?: boolean;
        isTrialCompleted?: boolean;
      } = {
        user: userResponse,
        accessToken,
        refreshToken,
        isProfileComplete,
      };

      if (isPaid !== undefined) {
        result.isPaid = isPaid;
      }
      if (isTrialCompleted !== undefined) {
        result.isTrialCompleted = isTrialCompleted;
      }

      logger.info(
        `User login success: ${email}, role: ${role}, approvalStatus: ${user.approvalStatus}`
      );
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`User login failed: ${email} - ${errorMessage}`);
      throw error;
    }
  }

  async markUserAsVerified(data: SendOtpDto) {
    try {
      if (data.role === "student")
        await this._studentRepo.markUserVerified(data.email);
      else await this._mentorRepo.markUserVerified(data.email);
      logger.info(`User marked verified: ${data.email}, role: ${data.role}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to mark user verified: ${data.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async sendForgotPasswordOtp(data: SendOtpDto): Promise<void> {
    try {
      const repo =
        data.role === "student" ? this._studentRepo : this._mentorRepo;
      const user = await repo.findByEmail(data.email);
      if (!user)
        throw new Error(`No ${data.role} account found with this email`);

      await this._otpService.generateAndSaveOtp(
        data.email,
        "forgotPassword",
        "email",
        new Date(Date.now() + 10 * 60 * 1000),
        data.role
      );
      logger.info(
        `Forgot password OTP sent to: ${data.email}, role: ${data.role}`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to send forgot password OTP: ${data.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  // async resetPassword(data: ForgotPasswordDto): Promise<void> {
  //   try {
  //     const { email, otp, password, confirmPassword } = data;

  //     if (password !== confirmPassword)
  //       throw new Error("Passwords do not match");

  //     const verifiedOtp = await this._otpService.verifyOtp(
  //       email,
  //       "forgotPassword",
  //       otp
  //     );
  //     if (!verifiedOtp) throw new Error("Invalid or expired OTP");

  //     const hashedPassword = await hashPassword(password);
  //     await this._authRepo.updatePassword(email, hashedPassword);

  //     logger.info(`Password reset successful: ${email}`);
  //   } catch (error: unknown) {
  //     const errorMessage = error instanceof Error ? error.message : "Unknown error";
  //     logger.error(`Password reset failed: ${data.email} - ${errorMessage}`);
  //     throw error;
  //   }
  // }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const user = await this._authRepo.findByEmail(email);
      if (!user) return null;

      logger.info(`Fetched user by email: ${email}`);
      return UserMapper.toAuthUser(user);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to fetch user by email: ${email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async getMentorProfile(email: string): Promise<MentorBaseResponseDto | null> {
    try {
      const user = await this._mentorRepo.findByEmail(email);
      if (!user) return null;

      return UserMapper.toMentorResponseDto(user as MentorAuthUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to get mentor profile: ${email} - ${errorMessage}`);
      throw error;
    }
  }

  async getStudentProfile(
    email: string
  ): Promise<StudentBaseResponseDto | null> {
    try {
      const user = await this._studentRepo.findByEmail(email);
      if (!user) return null;

      return UserMapper.toStudentResponseDto(user as StudentAuthUser);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to get student profile: ${email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async getUserById(id: string, role: string): Promise<UserContextResponse> {
    try {
      const repo = role === "student" ? this._studentRepo : this._mentorRepo;
      const user = await repo.findById(id);
      
      if (!user) {
        throw new AppError("User not found", HttpStatusCode.NOT_FOUND);
      }

      let isProfileComplete = false;
      let isPaid: boolean | undefined = undefined;
      let isTrialCompleted: boolean | undefined = undefined;

      if (role === "mentor") {
        isProfileComplete = this._profileService.isMentorProfileComplete(
          user as MentorAuthUser
        );
      } else {
        const studentUser = user as StudentAuthUser;
        isPaid = Boolean(studentUser.isPaid);
        isProfileComplete = Boolean(studentUser.isProfileCompleted);
        isTrialCompleted = Boolean(studentUser.isTrialCompleted);
      }

      const userResponse: AuthUser = UserMapper.toLoginAuthUser(
        user as MentorAuthUser | StudentAuthUser,
        isProfileComplete
      );
      
      if (role === 'mentor') {
          userResponse.approvalStatus = (user as MentorAuthUser).approvalStatus;
      }

      const response: UserContextResponse = {
        user: userResponse,
        isProfileComplete,
      };

      if (isPaid !== undefined) response.isPaid = isPaid;
      if (isTrialCompleted !== undefined) response.isTrialCompleted = isTrialCompleted;
      
      return response;
    } catch (error) {
      logger.error(`Failed to get user by id: ${id} - ${error}`);
      throw error;
    }
  }
}