import { OtpModel } from "../models/otp.model.js";
import type { IOtp } from "../interfaces/models/otp.interface.js";

export class OtpRepository {
  async saveOtp(
    email: string,
    otp: string,
    otpPurpose: "signup" | "forgotPassword",
    expiresAt: Date,
    deliveryMethod: "email" | "phone",
    role: "student" | "mentor",
  ): Promise<IOtp> {
    const newOtp = new OtpModel({
      email,
      otp,
      otpPurpose,
      expiresAt,
      deliveryMethod,
      role,
    });
    return await newOtp.save();
  }

  async findOtp(email: string, otpPurpose: string): Promise<IOtp | null> {
    return await OtpModel.findOne({ email, otpPurpose });
  }

  async deleteOtp(email: string, otpPurpose: string): Promise<void> {
    await OtpModel.deleteMany({ email, otpPurpose });
  }
  async findByOtp(otp: string, otpPurpose: "signup" | "forgotPassword"): Promise<IOtp | null> {

    return await OtpModel.findOne({otp,otpPurpose});
   }
}
