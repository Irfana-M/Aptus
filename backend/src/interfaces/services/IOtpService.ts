import type { IOtp } from "../models/otp.interface.js";

export interface IOtpService {
  generateAndSaveOtp(
    email: string,
    otpPurpose: "signup" | "forgotPassword",
    deliveryMethod: "email",
    expiresAt: Date,
    role: "student" | "mentor",
  ): Promise<IOtp>;

  verifyOtp(
    email: string,
    otpPurpose: "signup" | "forgotPassword",
    otp: string,
  ): Promise<IOtp>;

  resendOtp(
    email: string,
  ): Promise<void>
  
findByOtp(
  otp: string,
  otpPurpose: "signup" | "forgotPassword"
): Promise<IOtp | null>;

  

}
