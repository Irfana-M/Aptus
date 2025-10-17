import type { IOtp } from "../models/otp.interface.js";

export interface IOtpRepository {
  saveOtp(
    email: string,
    otp: string,
    otpPurpose: "signup" | "forgotPassword",
    expiresAt: Date,
    deliveryMethod: "email",
    role: "student" | "mentor",
  ): Promise<IOtp>;

  findOtp(email: string, otpPurpose: string): Promise<IOtp | null>;

  deleteOtp(email: string, otpPurpose: string): Promise<void>;

  findByOtp(email: string, otpPurpose: string): Promise<IOtp | null>;
}
