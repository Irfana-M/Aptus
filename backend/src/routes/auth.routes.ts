import { Router } from "express";
import passport from "../config/passport.config";
import { generateAccessToken } from "../utils/jwt.util";
import { env } from "../utils/env";
import type { Request, Response, NextFunction } from "express";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";


import type { AuthController } from "../controllers/auth.controller";
import type { OtpController } from "../controllers/otp.controller";
import type { MentorModel } from "../models/mentor/mentor.model";
import type { StudentModel } from "../models/student/student.model";

const router = Router();


const authController = container.get<AuthController>(TYPES.AuthController);
const otpController = container.get<OtpController>(TYPES.OtpController);

router.get(
  "/google",
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
  "/google/callback",
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("google", {
      failureRedirect: `${env.frontend.loginUrl}?error=google_auth_failed`,
      session: false,
    }, async (err: any, user: any, info: any) => {
      try {
        if (err || !user) {
          console.error('Google auth failed:', err || info);
          return res.redirect(`${env.frontend.loginUrl}?error=auth_failed`);
        }

    
        let role = 'student';
        try {
          if (req.query.state) {
            const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
            role = stateData.role || 'student';
          }
        } catch (error) {
          console.warn('Failed to decode state, using default role');
        }

        const googleUser = user;
        const userEmail = googleUser.emails?.[0]?.value || googleUser.email;

        if (!userEmail) {
          return res.redirect(`${env.frontend.loginUrl}?error=no_email`);
        }

        const token = generateAccessToken({
          email: userEmail,
          id: googleUser.id || `google-${Date.now()}`,
          role: role as "student" | "mentor",
        });

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

router.post("/signup", (req, res) => authController.registerUser(req, res));
router.post("/signup/verify-otp", (req, res) => otpController.verifySignupOtp(req, res));
router.post("/signup/resend-otp", (req, res) => otpController.resendOtp(req, res));
router.post("/login", (req, res) => authController.login(req, res));
router.post("/forgot-password/send-otp", (req, res) => authController.sendForgotPasswordOtp(req, res));
import { requireAuth } from "@/middleware/authMiddleware";

router.post("/refresh", (req, res, next) => authController.refreshAccessToken(req, res, next));
router.get("/me", requireAuth, (req, res, next) => authController.getMe(req, res));
router.post("/logout", (req, res) => authController.logout(req, res));

export default router;