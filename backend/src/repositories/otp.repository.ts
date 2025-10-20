import { OtpModel } from "../models/otp.model.js";
import type { IOtp } from "../interfaces/models/otp.interface.js";
import { logger } from "../utils/logger.js";

export class OtpRepository {
  async saveOtp(
    email: string,
    otp: string,
    otpPurpose: "signup" | "forgotPassword",
    expiresAt: Date,
    deliveryMethod: "email" | "phone",
    role: "student" | "mentor"
  ): Promise<IOtp> {
    try {
      const newOtp = new OtpModel({
        email,
        otp,
        otpPurpose,
        expiresAt,
        deliveryMethod,
        role,
      });
      const savedOtp = await newOtp.save();
      logger.info(`OTP saved for ${email}, purpose: ${otpPurpose}, role: ${role}`);
      return savedOtp;
    } catch (error: any) {
      logger.error(`Failed to save OTP for ${email}: ${error.message}`);
      throw new Error("Failed to save OTP");
    }
  }

  async findOtp(email: string, otpPurpose: string): Promise<IOtp | null> {
    try {
      const otp = await OtpModel.findOne({ email, otpPurpose }).lean().exec();
      if (otp) {
        logger.info(`OTP found for ${email}, purpose: ${otpPurpose}`);
      } else {
        logger.warn(`No OTP found for ${email}, purpose: ${otpPurpose}`);
      }
      return otp;
    } catch (error: any) {
      logger.error(`Error finding OTP for ${email}: ${error.message}`);
      throw new Error("Failed to find OTP");
    }
  }

  async deleteOtp(email: string, otpPurpose: string): Promise<void> {
    try {
      const result = await OtpModel.deleteMany({ email, otpPurpose });
      logger.info(`Deleted ${result.deletedCount} OTP(s) for ${email}, purpose: ${otpPurpose}`);
    } catch (error: any) {
      logger.error(`Failed to delete OTP for ${email}: ${error.message}`);
      throw new Error("Failed to delete OTP");
    }
  }

  async findByOtp(
    otp: string,
    otpPurpose: "signup" | "forgotPassword"
  ): Promise<IOtp | null> {
    try {
      const foundOtp = await OtpModel.findOne({ otp, otpPurpose }).lean().exec();
      if (foundOtp) {
        logger.info(`OTP matched for email: ${foundOtp.email}, purpose: ${otpPurpose}`);
      } else {
        logger.warn(`OTP not found or expired: ${otp}, purpose: ${otpPurpose}`);
      }
      return foundOtp;
    } catch (error: any) {
      logger.error(`Error finding OTP ${otp}: ${error.message}`);
      throw new Error("Failed to find OTP by code");
    }
  }
}
