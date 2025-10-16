import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/authService.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { OtpService } from "../services/otp.services.js";
import { NodemailerService } from "../services/email.service.js";
import { OtpRepository } from "../repositories/otp.repository.js";
import { OtpController } from "../controllers/otp.controller.js";

import { StudentAuthRepository } from "../repositories/studentAuth.repository.js";
import { MentorAuthRepository } from "../repositories/mentorAuth.repository.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";

import express from "express";
import passport from   "../config/passport.config.js"
import jwt from "jsonwebtoken";
import { generateAccessToken } from "../utils/jwt.util.js";

const router = Router();

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"],session: false,
    prompt: "select_account" }));

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "http://localhost:5173/login?error=google_auth_failed",session: false }),
  (req, res) => {
    try{
    const user = req.user as any;

    if (!user) {
        return res.redirect("http://localhost:5173/login?error=no_user");
      }
    
    const token = generateAccessToken({
      email: user.email,
      id: user._id || user.id,
        role: user.role || "student"
    });

    console.log("Google auth successful, redirecting with token");
    
    res.redirect(`http://localhost:5173/auth/google/callback?token=${token}&email=${user.email}`);
  }
  catch (error) {
      console.error("Token generation error:", error);
      res.redirect("http://localhost:5173/login?error=token_error");
    }
}
);



const studentRepo = new StudentAuthRepository();   
const mentorRepo = new MentorAuthRepository();
const authRepository = new AuthRepository(mentorRepo, studentRepo);
const otpRepository = new OtpRepository();
const emailService = new NodemailerService();

const verificationRepositories = new Map<string, any>([
  ["student", studentRepo],
  ["mentor", mentorRepo],
]);

const authRepositories: Map<string, IAuthRepository> = new Map<string, IAuthRepository>([
  ["student", studentRepo as IAuthRepository],
  ["mentor", mentorRepo as IAuthRepository],
]);


const otpService = new OtpService(otpRepository, emailService, verificationRepositories, authRepositories );
const authService = new AuthService(
  authRepository,
  otpService,
  emailService,
  studentRepo,
  mentorRepo
);
const authController = new AuthController(authService);
const otpController = new OtpController(otpService);


router.post("/signup", authController.registerUser);
router.post("/signup/verify-otp", otpController.verifySignupOtp);
router.post("/signup/resend-otp", otpController.resendOtp);
router.post("/login", authController.login);
router.post("/forgot-password/send-otp", authController.sendForgotPasswordOtp);
router.post("/forgot-password/reset", authController.resetPassword);

export default router;
