import { Schema, model } from "mongoose";
import type { IOtp } from "../interfaces/models/otp.interface"

const otpSchema = new Schema<IOtp>(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    deliveryMethod: {
      type: String,
      enum: ["email", "phone"],
      default: "email",
    },
    otpPurpose: {
      type: String,
      enum: ["signup", "forgotPassword"],
      required: true,
    },
    expiresAt: { type: Date, required: true },
    role: { type: String, enum: ["student", "mentor"], default: undefined },
  },
  { timestamps: true }
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const OtpModel = model<IOtp>("Otp", otpSchema);
