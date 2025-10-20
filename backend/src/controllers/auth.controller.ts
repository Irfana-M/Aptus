import type { Request, Response } from "express";
import type { IAuthService } from "../interfaces/services/IauthService.js";
import { studentRegisterSchema } from "../validations/authValidation/signup.validation.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { logger } from "../utils/logger.js"; // Winston logger

export class AuthController {
  constructor(
    private _authService: IAuthService,
    private _otpService: IOtpService
  ) {}

  registerUser = async (req: Request, res: Response) => {
    try {
      const parsedData = studentRegisterSchema.parse(req.body);

      const result = await this._authService.registerUser({
        ...parsedData,
        role: req.body.role,
      });

      logger.info(`User registration success: ${parsedData.email}`);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      logger.error(`User registration failed: ${error.message}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;

      const result = await this._authService.loginUser({ email, password, role });

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      logger.info(`User login success: ${email}, role: ${role}`);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        user: result.user,
        accessToken: result.accessToken,
        isProfileComplete: result.isProfileComplete,
        isPaid: result.isPaid,
      });
    } catch (error: any) {
      logger.error(`User login failed: ${req.body.email} - ${error.message}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  };

  sendForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;

      if (!email) throw new Error("Email is required");
      if (!role || !["student", "mentor"].includes(role)) throw new Error("Role is required");

      await this._authService.sendForgotPasswordOtp(email, role);

      logger.info(`Forgot password OTP sent to: ${email}, role: ${role}`);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error: any) {
      logger.error(`Forgot password OTP failed: ${req.body.email} - ${error.message}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { otp, password, confirmPassword } = req.body;

      if (!otp || !password || !confirmPassword) {
        logger.warn(`Reset password attempt failed: missing fields`);
        return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "All fields are required" });
      }

      const otpData = await this._otpService.findByOtp(otp, "forgotPassword");
      if (!otpData) {
        logger.warn(`Reset password attempt failed: invalid/expired OTP`);
        return res.status(HttpStatusCode.BAD_REQUEST).json({ message: "Invalid or expired OTP" });
      }

      const email = otpData.email;
      await this._authService.resetPassword(email, otp, password, confirmPassword);

      logger.info(`Password reset successful for: ${email}`);

      return res.status(HttpStatusCode.OK).json({ message: "Password reset successful" });
    } catch (error: any) {
      logger.error(`Reset password failed: ${error.message}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  };
}
