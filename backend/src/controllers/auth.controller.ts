import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { NextFunction, Request, Response } from "express";
import type { IAuthService } from "../interfaces/services/IauthService";
import { studentRegisterSchema } from "../validations/authValidation/signup.validation";
import type { IOtpService } from "../interfaces/services/IOtpService";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";
import type { RegisterUserDto } from "../dto/auth/RegisteruserDTO";
import type { LoginUserDto } from "../dto/auth/LoginUserDTO";
import type { SendOtpDto } from "../dto/auth/OtpDTO";
import type { ForgotPasswordDto } from "../dto/auth/ForgotPasswordDTO";
import { generateAccessToken, verifyRefreshToken } from "@/utils/jwt.util";
import { AppError } from "@/utils/AppError";
import { config } from "../config/app.config";

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.IAuthService) private _authService: IAuthService,
    @inject(TYPES.IOtpService) private _otpService: IOtpService
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`User registration failed: ${errorMessage}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const loginData: LoginUserDto = req.body;

      const result = await this._authService.loginUser(loginData);

      res.cookie(
        "refreshToken",
        result.refreshToken,
        config.cookie.refreshToken
      );

      console.log(result);

      logger.info(
        `User login success: ${loginData.email}, role: ${loginData.role}}`
      );

      return res.status(HttpStatusCode.OK).json({
        success: true,
        user: {
          ...result.user,
          role: loginData.role,
          isProfileComplete: result.isProfileComplete,
          isPaid: result.isPaid,
          isTrialCompleted: result.isTrialCompleted,
        },
        accessToken: result.accessToken,
        isProfileComplete: result.isProfileComplete,
        isPaid: result.isPaid,
        isTrialCompleted: result.isTrialCompleted,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(`User login failed: ${req.body.email} - ${errorMessage}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  refreshAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError(
          "No refresh token provided",
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        throw new AppError(
          "Invalid or expired refresh token",
          HttpStatusCode.FORBIDDEN
        );
      }

      const newAccessToken = generateAccessToken({
        id: payload.id,
        role: payload.role,
        email: payload.email,
      });

      logger.info(
        `Access token refreshed for user ${payload.id} (${payload.role})`
      );

      return res.status(HttpStatusCode.OK).json({
        success: true,
        accessToken: newAccessToken,
        message: "Access token refreshed successfully",
      });
    } catch (error) {
      next(
        error instanceof AppError
          ? error
          : new AppError(
              "Token refresh failed",
              HttpStatusCode.INTERNAL_SERVER_ERROR
            )
      );
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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Forgot password OTP failed: ${req.body.email} - ${errorMessage}`
      );
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        success: false,
        message: errorMessage,
      });
    }
  };

  logout = async (req: Request, res: Response) => {
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res
      .status(HttpStatusCode.OK)
      .json({ success: true, message: "Logged out successfully" });
  };

  getMe = async (req: Request, res: Response) => {
    try {
      // req.user is populated by the auth middleware
      const user = (req as any).user;

      if (!user) {
        return res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: "Not authenticated",
        });
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        user: user,
      });
    } catch (error) {
      console.error("Error in getMe:", error);
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to fetch user details",
      });
    }
  };
}
