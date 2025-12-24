import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response } from "express";
import type { IOtpService } from "../interfaces/services/IOtpService";

@injectable()
export class OtpController {
  constructor(@inject(TYPES.IOtpService) private _otpService: IOtpService) {}

  verifySignupOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res
          .status(400)
          .json({ success: false, message: "Email and OTP are required" });
        return;
      }

      const savedOtp = await this._otpService.verifyOtp(email, "signup", otp);

      if (!savedOtp) {
        res
          .status(400)
          .json({ success: false, message: "Invalid or expired OTP" });
        return;
      }

      res
        .status(200)
        .json({ success: true, message: "OTP verified successfully" });
    } catch (error: unknown) {
      console.error("Error verifying OTP:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      res
        .status(500)
        .json({ success: false, message });
    }
  };

  resendOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this._otpService.resendOtp(email);
      res
        .status(200)
        .json({ success: true, message: "OTP resent successfully" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(400).json({ success: false, message });
    }
  };
}
