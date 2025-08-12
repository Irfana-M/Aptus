import { Schema, model } from 'mongoose';
import type { IOtp } from '../interfaces/otp.interface';

const otpSchema = new Schema<IOtp>(
    {
        userId: {type: String, required: true},
        otp: { type: String, required: true },
        deliveryMethod: { type: String, enum: ["email", "phone"], default: "email" },
        otpPurpose: { type: String, enum: ["signup", "forgotPassword"], required: true },
        expiresAt: { type: Date, required: true },
     },
  { timestamps: true }
);

otpSchema.index({createdAt: 1}, {expireAfterSeconds: 60})
export const OtpModel = model<IOtp>("Otp", otpSchema);