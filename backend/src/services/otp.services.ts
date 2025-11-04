import { injectable, inject } from 'inversify';
import type { IOtpService } from "../interfaces/services/IOtpService";
import type { IOtpRepository } from "../interfaces/repositories/IOtpRepository";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository";
import { generateRandomOtp } from "../utils/otp.utils";
import type { IOtp } from "../interfaces/models/otp.interface";
import type { IAuthRepository } from '@/interfaces/auth/IAuthRepository';
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import type { IEmailService } from "../interfaces/services/IEmailService";
import { TYPES } from '../types';

@injectable()
export class OtpService implements IOtpService {
  constructor(
    @inject(TYPES.IOtpRepository) private _otpRepository: IOtpRepository,
    @inject(TYPES.EmailService) private _emailService: IEmailService,
    @inject(TYPES.IVerificationRepository) private _verificationRepositories: Map<string, IVerificationRepository>,
    @inject(TYPES.IAuthRepository) private _authRepositories: Map<string, IAuthRepository>
  ) {}

  async generateAndSaveOtp(
    email: string,
    otpPurpose: "signup" | "forgotPassword",
    deliveryMethod: "email",
    expiresAt: Date,
    role: "student" | "mentor"
  ): Promise<IOtp> {
    try {
      await this._otpRepository.deleteOtp(email, otpPurpose);
      const otp = generateRandomOtp();

      const savedOtp = await this._otpRepository.saveOtp(
        email,
        otp,
        otpPurpose,
        expiresAt,
        deliveryMethod,
        role
      );

      logger.info(
        `OTP generated and saved for ${email}, purpose: ${otpPurpose}`
      );

      if (deliveryMethod === "email") {
        let subject: string;
        let html: string;

        if (otpPurpose === "signup") {
          subject = "Verify your Mentora account";
          html = `<p>Your verification OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`;
        } else {
          subject = "Mentora Password Reset OTP";
          html = `<p>Your password reset OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`;
        }

        await this._emailService.sendMail(email, subject, html);
        logger.info(`OTP email sent to ${email}`);
      }

      return savedOtp;
    } catch (error: any) {
      logger.error(`Failed to generate OTP for ${email}: ${error.message}`);
      (error as any).statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
      throw error;
    }
  }

  async verifyOtp(
    email: string,
    otpPurpose: "signup" | "forgotPassword",
    enteredOtp: string
  ): Promise<IOtp> {
    const savedOtp = await this._otpRepository.findOtp(email, otpPurpose);

    if (!savedOtp) throw new Error("OTP not found");
    if (savedOtp.expiresAt < new Date()) {
      await this._otpRepository.deleteOtp(email, otpPurpose);
      throw new Error("OTP expired");
    }
    if (savedOtp.otp !== enteredOtp) throw new Error("Invalid OTP");
    if (otpPurpose === "signup") {
      if (!savedOtp.role || !["student", "mentor"].includes(savedOtp.role)) {
        throw new Error(`Invalid or missing role in OTP for email: ${email}`);
      }

      const authRepository = this._verificationRepositories.get(savedOtp.role);
      if (!authRepository) {
        throw new Error(`No repository found for role: ${savedOtp.role}`);
      }
      await authRepository.markUserVerified(email);
    }

    await this._otpRepository.deleteOtp(email, otpPurpose);

    return savedOtp;
  }

  async resendOtp(email: string): Promise<void> {
    let user = null;
    let role: "student" | "mentor" | null = null;

    user = await this._authRepositories.get("student")?.findByEmail(email);
    if (user) role = "student";

    if (!user) {
      user = await this._authRepositories.get("mentor")?.findByEmail(email);
      if (user) role = "mentor";
    }

    if (!user || !role) throw new Error("User not found");

    await this._otpRepository.deleteOtp(email, "signup");

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this._otpRepository.saveOtp(
      email,
      newOtp,
      "signup",
      expiresAt,
      "email",
      role
    );

    await this._emailService.sendMail(
      email,
      "Resend OTP - Mentora",
      `<p>Your new OTP is <b>${newOtp}</b>. It expires in 5 minutes.</p>`
    );
  }

  async findByOtp(
    otp: string,
    otpPurpose: "signup" | "forgotPassword"
  ): Promise<IOtp | null> {
    const otpRecord = await this._otpRepository.findByOtp(otp, otpPurpose);
    console.log(otpRecord);
    if (!otpRecord) return null;
    if (otpRecord.expiresAt < new Date()) {
      await this._otpRepository.deleteOtp(otpRecord.email, otpPurpose);
      return null;
    }
    return otpRecord;
  }
}
