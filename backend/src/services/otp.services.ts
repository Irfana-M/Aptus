import type { IOtpService } from "../interfaces/services/IOtpService.js";
import type { IOtpRepository } from "../interfaces/repositories/IOtpRepository.js";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository.js";
import { generateRandomOtp } from "../utils/otp.utils.js";
import type { IOtp } from "../interfaces/models/otp.interface.js";
import { NodemailerService } from "./email.service.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";

export class OtpService implements IOtpService {
  constructor(
    private _otpRepository: IOtpRepository,
    private _emailService: NodemailerService,
    private _verificationRepositories: Map<string, IVerificationRepository>,
    private _authRepositories: Map<string, IAuthRepository>
  ) {}

  async generateAndSaveOtp(
    email: string,
    otpPurpose: "signup" | "forgotPassword",
    deliveryMethod: "email",
    expiresAt: Date,
    role: "student" | "mentor"
  ): Promise<IOtp> {
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

    // if (deliveryMethod === "email") {
    //   await this._emailService.sendMail(
    //     email,
    //     otpPurpose === "signup"
    //       ? "Verify your Mentora account"
    //       : "Mentora Password Reset",
    //     `<p>Your OTP is <b>${otp}</b>. It expires in 5 minutes.</p>`
    //   );
    // }
    return savedOtp;
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
}
