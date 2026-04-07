import { Router } from "express";
import { AUTH_ROUTES } from "../constants/routes";
import passport from "../config/passport.config";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";
import { config } from "../config/app.config";
import { env } from "../utils/env";
import type { Request, Response, NextFunction } from "express";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import rateLimit from "express-rate-limit";

import { validateBody } from "../middlewares/validate.middleware";
import { studentRegisterSchema } from "../validations/authValidation/signup.validation";
import { loginSchema } from "../validations/authValidation/login.validation";

// Rate limiter for login and forgot-password (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for registration and OTP routes (spam protection)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

import type { AuthController } from "../controllers/auth.controller";
import type { OtpController } from "../controllers/otp.controller";
// Unused models removed
interface GoogleUser {
  id: string;
  emails?: { value: string }[];
  email?: string;
  _id?: string;
  isTrialCompleted?: boolean;
  isProfileCompleted?: boolean;
  isProfileComplete?: boolean;
  approvalStatus?: string;
  isPaid?: boolean;
}

const router = Router();


const authController = container.get<AuthController>(TYPES.AuthController);
const otpController = container.get<OtpController>(TYPES.OtpController);

router.get(
  AUTH_ROUTES.GOOGLE,
  (req: Request, res: Response, next: NextFunction) => {

    const role = req.query.role as string || 'student';
    
    
    const state = Buffer.from(JSON.stringify({ 
      role,
      timestamp: Date.now() 
    })).toString('base64');

    console.log(`🔐 Starting Google OAuth for role: ${role}`);
    
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: state, 
      accessType: "offline",
      prompt: "consent"
    })(req, res, next);
  }
);

router.get(
  AUTH_ROUTES.GOOGLE_CALLBACK,
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", {
      failureRedirect: `${env.frontend.loginUrl}?error=google_auth_failed`,
      session: false,
    }, async (err: Error | null, user: unknown, info: unknown) => {
      try {
        if (err || !user) {
          console.error('Google auth failed:', err || info);
          const errorMsg = err?.message || 'auth_failed';
          return res.redirect(`${env.frontend.loginUrl}?error=${encodeURIComponent(errorMsg)}`);
        }

        const googleUser = user as GoogleUser;

        let role = 'student';
        try {
          if (req.query.state) {
            const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
            role = stateData.role || 'student';
          }
        } catch {
          console.warn('Failed to decode state, using default role');
        }
        const userEmail = googleUser.emails?.[0]?.value || googleUser.email;

        if (!userEmail) {
          return res.redirect(`${env.frontend.loginUrl}?error=no_email`);
        }

        // Get the MongoDB _id if present (preferred for tokens)
        const userId = googleUser._id ? googleUser._id.toString() : (googleUser.id || `google-${Date.now()}`);

        const tokenPayload = {
          email: userEmail,
          id: userId,
          role: role as "student" | "mentor",
        };

        const token = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Set refresh token cookie consistently with normal login
        res.cookie(
          "refreshToken",
          refreshToken,
          config.cookie.refreshToken
        );

        console.log(`Google auth successful for ${role}: ${userEmail}`);

        let isTrialCompletedString = String(googleUser.isTrialCompleted ?? false);

        // Self-healing: If flag is false but user might have completed a trial
        if (role === 'student' && isTrialCompletedString === 'false') {
          try {
            const { TrialClass } = await import("../models/student/trialClass.model");
            const { StudentModel } = await import("../models/student/student.model");
            
            const completedTrial = await TrialClass.findOne({
              student: googleUser._id,
              status: 'completed'
            });

            if (completedTrial) {
              console.log(`🩹 Self-healing: Found completed trial for ${userEmail}, updating flag.`);
              await StudentModel.findByIdAndUpdate(googleUser._id, { isTrialCompleted: true });
              isTrialCompletedString = 'true';
            }
          } catch (healingError) {
            console.error("Self-healing check failed:", healingError);
          }
        }

        const redirectParams = new URLSearchParams({
          token: token,
          email: userEmail,
          role: role,
          isProfileComplete: String(googleUser.isProfileCompleted ?? (googleUser.isProfileComplete ?? false)),
          isTrialCompleted: isTrialCompletedString,
          approvalStatus: googleUser.approvalStatus || (role === 'mentor' ? 'pending' : 'approved'),
          isPaid: String(googleUser.isPaid ?? false),
          id: String(googleUser._id || googleUser.id),
        });

        console.log('🔗 Redirect URL:', `${env.frontend.googleCallbackUrl}?${redirectParams}`);

        return res.redirect(`${env.frontend.googleCallbackUrl}?${redirectParams}`);

      } catch (error: unknown) {
        console.error("Google callback error:", error);
        return res.redirect(`${env.frontend.loginUrl}?error=token_error`);
      }
    })(req, res, next);
  }
);

router.post(AUTH_ROUTES.SIGNUP, registerLimiter, validateBody(studentRegisterSchema), (req: Request, res: Response, next: NextFunction) => authController.registerUser(req, res, next));
router.post(AUTH_ROUTES.SIGNUP_VERIFY_OTP, registerLimiter, (req, res, next) => otpController.verifySignupOtp(req, res, next));
router.post(AUTH_ROUTES.SIGNUP_RESEND_OTP, registerLimiter, (req, res, next) => otpController.resendOtp(req, res, next));
router.post(AUTH_ROUTES.LOGIN, loginLimiter, validateBody(loginSchema), (req: Request, res: Response, next: NextFunction) => authController.login(req, res, next));
router.post(AUTH_ROUTES.FORGOT_PASSWORD_SEND_OTP, loginLimiter, (req, res, next) => authController.sendForgotPasswordOtp(req, res, next));
import { requireAuth } from "../middlewares/authMiddleware";

router.post(AUTH_ROUTES.REFRESH, (req, res, next) => authController.refreshAccessToken(req, res, next));
router.get(AUTH_ROUTES.ME, requireAuth, (req, res, next) => authController.getMe(req, res, next));
router.post(AUTH_ROUTES.LOGOUT, (req, res) => authController.logout(req, res));

export default router;