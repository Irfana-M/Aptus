import { OtpModel } from "../models/otp.model.js";
import type { Document, Model } from "mongoose";
import type { IOtp } from "../interfaces/models/otp.interface.js";
import { BaseRepository } from "./baseRepository.js";
import { logger } from "../utils/logger.js";
import { injectable } from "inversify";

@injectable()
export class OtpRepository extends BaseRepository<IOtp & Document> {
  constructor() {
    super(OtpModel as unknown as Model<IOtp & Document>);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to save OTP for ${email}: ${message}`);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding OTP for ${email}: ${message}`);
      throw new Error("Failed to find OTP");
    }
  }

  async deleteOtp(email: string, otpPurpose: string): Promise<void> {
    try {
      const result = await this.model.deleteMany({ email, otpPurpose });
      logger.info(
        `Deleted ${result.deletedCount} OTP(s) for ${email}, purpose: ${otpPurpose}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to delete OTP for ${email}: ${message}`);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding OTP ${otp}: ${message}`);
      throw new Error("Failed to find OTP by code");
    }
  }
}