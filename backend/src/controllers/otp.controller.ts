import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from "express";
import type { IOtpService } from "../interfaces/services/IOtpService";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages.constants";

@injectable()
export class OtpController {
  constructor(@inject(TYPES.IOtpService) private _otpService: IOtpService) {}

  verifySignupOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        throw new AppError(MESSAGES.OTP.EMAIL_OTP_REQUIRED, HttpStatusCode.BAD_REQUEST);
      }

      const savedOtp = await this._otpService.verifyOtp(email, "signup", otp);

      if (!savedOtp) {
        throw new AppError(MESSAGES.OTP.INVALID_OR_EXPIRED, HttpStatusCode.BAD_REQUEST);
      }

      res
        .status(HttpStatusCode.OK)
        .json({ success: true, message: MESSAGES.OTP.VERIFY_SUCCESS });
    } catch (error: unknown) {
      next(error);
    }
  };

  resendOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      if (!email) throw new AppError(MESSAGES.OTP.EMAIL_REQUIRED, HttpStatusCode.BAD_REQUEST);

      await this._otpService.resendOtp(email);
      res
        .status(HttpStatusCode.OK)
        .json({ success: true, message: MESSAGES.OTP.RESEND_SUCCESS });
    } catch (error: unknown) {
      next(error);
    }
  };
}
