import { OtpModel } from "../models/otp.model";
import type { IOtp } from "../interfaces/models/otp.interface";
import { BaseRepository } from "./baseRepository";
import { logger } from "../utils/logger";
import { injectable } from "inversify";

@injectable()
export class OtpRepository extends BaseRepository<IOtp> {
  constructor() {
    super(OtpModel);
  }

  async saveOtp(
    email: string,
    otp: string,
    otpPurpose: "signup" | "forgotPassword",
    expiresAt: Date,
    deliveryMethod: "email",
    role: "student" | "mentor"
  ): Promise<IOtp> {
    try {
      const otpData: Partial<IOtp> = {
        email,
        otp,
        otpPurpose,
        expiresAt,
        deliveryMethod,
        role,
      };
      
      const savedOtp = await this.create(otpData);
      logger.info(
        `OTP saved for ${email}, purpose: ${otpPurpose}, role: ${role}`
      );
      return savedOtp;
    } catch (error: any) {
      logger.error(`Failed to save OTP for ${email}: ${error.message}`);
      throw new Error("Failed to save OTP");
    }
  }

  async findOtp(email: string, otpPurpose: string): Promise<IOtp | null> {
    try {
      const otp = await this.findOne({ email, otpPurpose } as Partial<IOtp>);
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
      const result = await this.model.deleteMany({ email, otpPurpose });
      logger.info(
        `Deleted ${result.deletedCount} OTP(s) for ${email}, purpose: ${otpPurpose}`
      );
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
      const foundOtp = await this.findOne({ otp, otpPurpose });
      if (foundOtp) {
        logger.info(
          `OTP matched for email: ${foundOtp.email}, purpose: ${otpPurpose}`
        );
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