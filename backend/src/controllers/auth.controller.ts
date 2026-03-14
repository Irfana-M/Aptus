import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { NextFunction, Request, Response } from "express";
import type { IAuthService } from "../interfaces/services/IauthService.js";
import { studentRegisterSchema } from "../validations/authValidation/signup.validation.js";
import { loginSchema } from "../validations/authValidation/login.validation.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { MESSAGES } from "../constants/messages.constants.js";
import { logger } from "../utils/logger.js";
import type { RegisterUserDto } from "../dtos/auth/RegisteruserDTO.js";
import type { LoginUserDto } from "../dtos/auth/LoginUserDTO.js";
import type { SendOtpDto } from "../dtos/auth/OtpDTO.js";
import { UserRole } from "../enums/user.enum.js";
import { generateAccessToken, verifyRefreshToken } from "@/utils/jwt.util.js";
import { AppError } from "@/utils/AppError.js";
import { config } from "../config/app.config.js";

@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.IAuthService) private _authService: IAuthService,
    @inject(TYPES.IOtpService) private _otpService: IOtpService
  ) {}

  registerUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { referralCode, ...userData }: RegisterUserDto & { referralCode?: string } = req.body;

      const result = await this._authService.registerUser(userData);

      logger.info(`User registration success: ${userData.email}`);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: result.message,
      });
    } catch (error: unknown) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, role }: LoginUserDto = req.body;

      const result = await this._authService.loginUser({ email, password, role });

      res.cookie(
        "refreshToken",
        result.refreshToken,
        config.cookie.refreshToken
      );

      logger.info(
        `[login] ✅ Login success: ${email} | role: ${role} | hasAccessToken: ${!!result.accessToken} | isProfileComplete: ${result.isProfileComplete} | isPaid: ${result.isPaid} | isTrialCompleted: ${result.isTrialCompleted}`
      );

      return res.status(HttpStatusCode.OK).json({
        success: true,
        user: {
          ...result.user,
          role,
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
      next(error);
    }
  };

  refreshAccessToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = req.cookies?.refreshToken;

      logger.info(
        `[refreshAccessToken] Request received | hasCookie: ${!!refreshToken} | origin: ${req.headers.origin} | cookieKeys: ${Object.keys(req.cookies || {}).join(", ") || "none"}`
      );

      if (!refreshToken) {
        logger.warn(`[refreshAccessToken] ❌ BLOCKED — no refreshToken cookie present | origin: ${req.headers.origin}`);
        throw new AppError(
          MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED,
          HttpStatusCode.UNAUTHORIZED
        );
      }

      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        throw new AppError(
          MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
          HttpStatusCode.FORBIDDEN
        );
      }

      const newAccessToken = generateAccessToken({
        id: payload.id,
        role: payload.role,
        email: payload.email,
      });

      const userData = await this._authService.getUserById(payload.id, payload.role);

      logger.info(
        `[refreshAccessToken] ✅ Token refreshed | userId: ${payload.id} | role: ${payload.role}`
      );

      const userResponse: Record<string, unknown> = {
        ...userData.user,
        role: payload.role,
        isProfileComplete: userData.isProfileComplete,
        isPaid: userData.isPaid,
        isTrialCompleted: userData.isTrialCompleted,
      };

      if (payload.role === UserRole.STUDENT) {
       
        userResponse.subscription = (userData.user as { subscription?: unknown }).subscription;
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        accessToken: newAccessToken,
        user: userResponse,
        isProfileComplete: userData.isProfileComplete,
        isPaid: userData.isPaid,
        isTrialCompleted: userData.isTrialCompleted,
        message: MESSAGES.AUTH.REFRESH_SUCCESS,
      });
    } catch (error) {
      logger.error(
        `[refreshAccessToken] ❌ Failed | hasCookie: ${!!req.cookies?.refreshToken} | origin: ${req.headers.origin} | error: ${error instanceof Error ? error.message : String(error)}`
      );
      
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      
      if (error instanceof AppError && error.message === MESSAGES.AUTH.USER_NOT_FOUND) {
         return next(new AppError(MESSAGES.AUTH.USER_NOT_EXISTS, HttpStatusCode.UNAUTHORIZED));
      }

      next(
        error instanceof AppError
          ? error
          : new AppError(
              MESSAGES.AUTH.REFRESH_FAILED,
              HttpStatusCode.INTERNAL_SERVER_ERROR
            )
      );
    }
  };

  sendForgotPasswordOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const otpData: SendOtpDto = req.body;

      if (!otpData.email) throw new AppError(MESSAGES.AUTH.EMAIL_REQUIRED, HttpStatusCode.BAD_REQUEST);
      if (!otpData.role || ![UserRole.STUDENT, UserRole.MENTOR].includes(otpData.role as UserRole))
        throw new AppError(MESSAGES.AUTH.ROLE_REQUIRED, HttpStatusCode.BAD_REQUEST);

      await this._authService.sendForgotPasswordOtp(otpData);

      logger.info(
        `Forgot password OTP sent to: ${otpData.email}, role: ${otpData.role}`
      );

      return res.status(HttpStatusCode.OK).json({
        success: true,
        message: MESSAGES.AUTH.OTP_SENT,
      });
    } catch (error: unknown) {
      next(error);
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
      .json({ success: true, message: MESSAGES.AUTH.LOGOUT_SUCCESS });
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const user = req.user;

      if (!user) {
        throw new AppError(MESSAGES.AUTH.NOT_AUTHENTICATED, HttpStatusCode.UNAUTHORIZED);
      }

      return res.status(HttpStatusCode.OK).json({
        success: true,
        user: user,
      });
    } catch (error: unknown) {
      next(error);
    }
  };
}
