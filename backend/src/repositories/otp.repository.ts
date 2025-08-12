import { OtpModel } from "../models/otp.model";
import type { IOtp } from "../interfaces/otp.interface";

export class OtpRepository {

    async saveOtp(userId: string, otp: string, otpPurpose: "signup" | "login" | "forgotPassword", expiresAt: Date, deliveryMethod: "email" | "phone" ): Promise<IOtp>{
            const newOtp = new OtpModel({userId, otp, otpPurpose, expiresAt, deliveryMethod});
            return await newOtp.save();
        }

    async findOtp(userId: string, otpPurpose: string): Promise<IOtp | null> {
        return await OtpModel.findOne({userId, otpPurpose});
    }

    async deleteOtp(userId: string, otpPurpose: string): Promise<void> {
        await OtpModel.deleteMany({userId, otpPurpose});
    }
}