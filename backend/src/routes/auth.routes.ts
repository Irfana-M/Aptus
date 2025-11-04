import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { AuthRepository } from "../repositories/auth.repository";
import { OtpService } from "../services/otp.services";
import { NodemailerService } from "../services/email.service";
import { OtpRepository } from "../repositories/otp.repository";
import { OtpController } from "../controllers/otp.controller";

import { StudentAuthRepository } from "../repositories/studentAuth.repository";
import { MentorAuthRepository } from "../repositories/mentorAuth.repository";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository";

import passport from "../config/passport.config";
import { generateAccessToken } from "../utils/jwt.util";
import { ProfileService } from "../services/profile.service";
import { env } from "../utils/env";
import type { Request, Response } from "express";
import { container } from "@/inversify.config";
import { TYPES } from "@/types";

const router = Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${env.frontend.loginUrl}?error=google_auth_failed`,
    session: false,
  }),
  (req: Request, res: Response) => {
  
    try {
      interface GoogleUser {
        email?: string;
        _id?: string;
        id?: string;
        role?: string;
      }

      const user = req.user as GoogleUser;

      if (!user) {
        return res.redirect(`${env.frontend.loginUrl}?error=no_user`);
      }

      if (!user.email) {
        return res.redirect(`${env.frontend.loginUrl}?error=no_email`);
      }

      const validRole = (user.role && ["student", "admin", "mentor"].includes(user.role)) 
        ? user.role as "student" | "admin" | "mentor"
        : "student";

      const token = generateAccessToken({
        email: user.email,
        id: user._id || user.id || "unknown",
        role: validRole, 
      });

      console.log("Google auth successful, redirecting with token");

      res.redirect(
        `${env.frontend.googleCallbackUrl}?token=${token}&email=${user.email}`
      );
    } catch (error: unknown) {
      console.error("Token generation error:", error);
      res.redirect(`${env.frontend.loginUrl}?error=token_error`);
    }
  }
);

const studentRepo = new StudentAuthRepository();
const mentorRepo = new MentorAuthRepository();
const authRepository = new AuthRepository(mentorRepo, studentRepo);
const otpRepository = new OtpRepository();
const emailService = new NodemailerService();
const profileService = new ProfileService();


const verificationRepositories: Map<string, IVerificationRepository> = new Map([
  ["student", studentRepo as IVerificationRepository],
  ["mentor", mentorRepo as IVerificationRepository],
]);


const authRepositories: Map<string, IAuthRepository> = new Map([
  ["student", studentRepo as IAuthRepository],
  ["mentor", mentorRepo as IAuthRepository],
]);

const otpService = new OtpService(
  otpRepository,
  emailService,
  verificationRepositories,
  authRepositories
);
const authService = new AuthService(
  authRepository,
  otpService,
  emailService,
  studentRepo,
  mentorRepo,
  profileService
);
const authController = container.get<AuthController>(TYPES.AuthController);
const otpController = container.get<OtpController>(TYPES.OtpController);

router.post("/signup", authController.registerUser);
router.post("/signup/verify-otp", otpController.verifySignupOtp);
router.post("/signup/resend-otp", otpController.resendOtp);
router.post("/login", authController.login);
router.post("/forgot-password/send-otp", authController.sendForgotPasswordOtp);
router.post("/refresh", authController.refreshAccessToken);

export default router;