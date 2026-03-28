import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import type { IEmailService } from "../interfaces/services/IEmailService.js";
import type { IStudentAuthRepository } from "../interfaces/repositories/IStudentAuthRepository.js";
import type { IMentorAuthRepository } from "../interfaces/repositories/IMentorAuthRepository.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { ITrialClassRepository } from "../interfaces/repositories/ITrialClassRepository.js";
import type { LoginUserDto } from "../dtos/auth/LoginUserDTO.js";
import type { RegisterUserDto } from "../dtos/auth/RegisteruserDTO.js";
import { hashPassword, comparePasswords } from "../utils/password.utils.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import type { IAuthService, UserContextResponse } from "../interfaces/services/IauthService.js";
import type {
  AuthUser,
  MentorAuthUser,
  StudentAuthUser,
} from "../interfaces/auth/auth.interface.js";
import type { IProfileService } from "../interfaces/services/IProfileService.js";
import { logger } from "../utils/logger.js";
import type { SendOtpDto } from "../dtos/auth/OtpDTO.js";
import type { VerifyOtpDto } from "../dtos/auth/VerifyOtpDTO.js";
// ForgotPasswordDto import removed as it is unused
import type {
  MentorBaseResponseDto,
  StudentBaseResponseDto,
} from "@/dtos/auth/UserResponseDTO.js";
import { UserMapper } from "@/mappers/userMapper.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { AppError } from "@/utils/AppError.js";
import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import * as crypto from 'crypto';
import { InternalEventEmitter, EVENTS } from "../utils/InternalEventEmitter.js";
import { MESSAGES } from "../constants/messages.constants.js";
import { UserRole } from "../enums/user.enum.js";

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
    @inject(TYPES.InternalEventEmitter) private _eventEmitter: InternalEventEmitter,
    @inject(TYPES.ITrialClassRepository) private _trialClassRepo: ITrialClassRepository,
    @inject(TYPES.IStudentRepository) private _studentGeneralRepo: IStudentRepository
  ) {}

  async registerUser(registrationData: RegisterUserDto) {
    try {
      const existingUser = await this._authRepo.findByEmail(registrationData.email);
      if (existingUser) throw new AppError(MESSAGES.AUTH.USER_EXISTS, HttpStatusCode.CONFLICT);

      if (registrationData.password !== registrationData.confirmPassword)
        throw new AppError(MESSAGES.AUTH.PASSWORDS_NOT_MATCH, HttpStatusCode.BAD_REQUEST);

      const hashedPassword = await hashPassword(registrationData.password);
      
      // Generate unique referral code for the new user
      const newReferralCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      // Handle referral usage (if new user signed up with a code)
      let referredBy = undefined;
      // Note: Data is typed as RegisterUserDto which has referralCode
      const inputRefCode = registrationData.referralCode;

      if (inputRefCode && registrationData.role === UserRole.STUDENT) {
         const referrer = await this._studentRepo.findByReferralCode(inputRefCode);
         if (referrer) {
            referredBy = referrer.referralCode;
         }
      }

      const userData: RegisterUserDto = {
        ...registrationData,
        password: hashedPassword,
        referralCode: newReferralCode,
      };

      if (referredBy) {
          userData.referredBy = referredBy;
      }

      const user = await this._authRepo.createUser(userData);

      await this.sendSignupOtp({ email: user.email, role: registrationData.role });

      logger.info(
        `User registered successfully: ${registrationData.email}, role: ${registrationData.role}`
      );

      this._eventEmitter.emit(EVENTS.USER_REGISTERED, {
        email: registrationData.email,
        role: registrationData.role,
        fullName: registrationData.fullName
      });

      return { message: MESSAGES.AUTH.REGISTRATION_SUCCESS };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
      logger.error(
        `User registration failed: ${registrationData.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async sendSignupOtp(otpData: SendOtpDto): Promise<void> {
    try {
      await this._otpService.generateAndSaveOtp(
        otpData.email,
        "signup",
        "email",
        new Date(Date.now() + 10 * 60 * 1000),
        otpData.role
      );
      logger.info(`Signup OTP sent to: ${otpData.email}, role: ${otpData.role}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
      logger.error(
        `Failed to send signup OTP to ${otpData.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async verifySignupOtp(verificationData: VerifyOtpDto) {
    try {
      const savedOtp = await this._otpService.verifyOtp(
        verificationData.email,
        "signup",
        verificationData.otp
      );
      if (!savedOtp) throw new AppError(MESSAGES.AUTH.INVALID_OTP, HttpStatusCode.BAD_REQUEST);

      const role =
        savedOtp.role ?? (await this._authRepo.findByEmail(verificationData.email))?.role;
      if (!role) throw new AppError(MESSAGES.AUTH.CANNOT_DETERMINE_ROLE, HttpStatusCode.BAD_REQUEST);

      await (role === UserRole.STUDENT
        ? this._studentRepo.markUserVerified(verificationData.email)
        : this._mentorRepo.markUserVerified(verificationData.email));

      // Referral credit logic removed as wallet system is deleted
      if (role === 'student') {
          const student = await this._studentRepo.findByEmail(verificationData.email);
          if (student && student.referredBy) {
             const referrer = await this._studentRepo.findByReferralCode(student.referredBy);
             if (referrer) {
                logger.info(`Referral would have been credited to ${referrer.email} for invoking ${student.email} (Wallet system removed)`);
             }
          }
      }

      await this._emailService.sendMail(
        verificationData.email,
        MESSAGES.AUTH.WELCOME_EMAIL_SUBJECT,
        MESSAGES.AUTH.VERIFIED_EMAIL_BODY
      );

      logger.info(`User verified successfully: ${verificationData.email}, role: ${role}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
      logger.error(
        `Signup verification failed for ${verificationData.email} - ${errorMessage}`
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
      const repo = role === UserRole.STUDENT ? this._studentRepo : this._mentorRepo;
      const user = await repo.findByEmail(email);
      if (!user) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);

      if (!user.isVerified) {
        throw new AppError(
          MESSAGES.AUTH.ACCOUNT_NOT_VERIFIED,
          HttpStatusCode.FORBIDDEN
        );
      }

      if (user.isBlocked) {
        throw new AppError(
          MESSAGES.AUTH.ACCOUNT_BLOCKED,
          HttpStatusCode.FORBIDDEN
        );
      }

      if (!user.password) {
        throw new AppError(
          MESSAGES.AUTH.AUTH_METHOD_NOT_SUPPORTED,
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const isMatch = await comparePasswords(password, user.password);
      if (!isMatch)
        throw new AppError(MESSAGES.AUTH.INVALID_CREDENTIALS, HttpStatusCode.UNAUTHORIZED);

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
        isProfileComplete = Boolean(studentUser.isProfileComplete || studentUser.isProfileCompleted);
        isTrialCompleted = Boolean(studentUser.isTrialCompleted);

        // Self-healing: If flag is false but user might have completed a trial
        if (!isTrialCompleted) {
          try {
            const completedTrial = await this._trialClassRepo.findOne({
              student: user._id.toString(),
              status: 'completed'
            });

            if (completedTrial) {
              logger.info(`🩹 Self-healing: Found completed trial for ${email}, updating flag.`);
              await this._studentGeneralRepo.updateById(user._id.toString(), { isTrialCompleted: true });
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
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
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
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
      logger.error(
        `Failed to mark user verified: ${data.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async sendForgotPasswordOtp(otpRequestData: SendOtpDto): Promise<void> {
    try {
      const repo =
        otpRequestData.role === UserRole.STUDENT ? this._studentRepo : this._mentorRepo;
      const user = await repo.findByEmail(otpRequestData.email);
      if (!user)
        throw new AppError(MESSAGES.AUTH.NO_ACCOUNT_FOUND, HttpStatusCode.NOT_FOUND);

      await this._otpService.generateAndSaveOtp(
        otpRequestData.email,
        "forgotPassword",
        "email",
        new Date(Date.now() + 10 * 60 * 1000),
        otpRequestData.role
      );
      logger.info(
        `Forgot password OTP sent to: ${otpRequestData.email}, role: ${otpRequestData.role}`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
      logger.error(
        `Failed to send forgot password OTP: ${otpRequestData.email} - ${errorMessage}`
      );
      throw error;
    }
  }

  // async resetPassword(data: ForgotPasswordDto): Promise<void> {
  //   try {
  //     const { email, otp, password, confirmPassword } = data;

  //     if (password !== confirmPassword)
  //       throw new Error(MESSAGES.AUTH.PASSWORDS_NOT_MATCH);

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
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
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
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
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
      const errorMessage = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
      logger.error(
        `Failed to get student profile: ${email} - ${errorMessage}`
      );
      throw error;
    }
  }

  async getUserById(id: string, role: string): Promise<UserContextResponse> {
    try {
      const repo = role === UserRole.STUDENT ? this._studentRepo : this._mentorRepo;
      const user = await repo.findById(id);
      
      if (!user) {
        throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
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
        isProfileComplete = Boolean(studentUser.isProfileComplete || studentUser.isProfileCompleted);
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