import type { Request, Response } from "express";
import type { IAuthService } from "../interfaces/services/IauthService.js";
import { studentRegisterSchema } from "../validations/authValidation/signup.validation.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { logger } from "../utils/logger.js"; // Winston logger
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import type { LoginUserDto } from "../dto/LoginUserDTO.js";
import type { SendOtpDto } from "../dto/otp.dto.js";
import type { ForgotPasswordDto } from "../dto/forgotPassword.dto.js";

export class AuthController {
  constructor(
    private _authService: IAuthService,
    private _otpService: IOtpService
  ) {}

  registerUser = async (req: Request, res: Response) => {
    try {
      const parsedData = studentRegisterSchema.parse(req.body);

      const userData: RegisterUserDto = {
        ...parsedData,
        role: req.body.role ?? "student",
      };

      const result = await this._authService.registerUser(userData);

      logger.info(`User registration success: ${userData.email}`);

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
      const loginData: LoginUserDto = req.body;

      const result = await this._authService.loginUser(loginData);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      logger.info(
        `User login success: ${loginData.email}, role: ${loginData.role}`
      );

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
      const data: SendOtpDto = req.body;

      if (!data.email) throw new Error("Email is required");
      if (!data.role || !["student", "mentor"].includes(data.role))
        throw new Error("Role is required");

      await this._authService.sendForgotPasswordOtp(data);

      logger.info(
        `Forgot password OTP sent to: ${data.email}, role: ${data.role}`
      );

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: "OTP sent successfully",
      });
    } catch (error: any) {
      logger.error(
        `Forgot password OTP failed: ${req.body.email} - ${error.message}`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, otp, password, confirmPassword, role } =
        req.body as ForgotPasswordDto;

      if (!email || !otp || !password || !confirmPassword || !role) {
        logger.warn(`Reset password attempt failed: missing fields`);
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ message: "All fields are required" });
      }

      const otpData = await this._otpService.findByOtp(otp, "forgotPassword");
      if (!otpData) {
        logger.warn(
          `Reset password attempt failed: invalid/expired OTP for ${email}`
        );
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json({ message: "Invalid or expired OTP" });
      }

      await this._authService.resetPassword({
        email,
        otp,
        password,
        confirmPassword,
        role,
      });

      logger.info(`Password reset successful for: ${email} (${role})`);

      return res
        .status(HttpStatusCode.OK)
        .json({ message: "Password reset successful" });
    } catch (error: any) {
      logger.error(`Reset password failed: ${error.message}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: error.message,
      });
    }
  };
}
