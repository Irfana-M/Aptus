import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { AuthService } from "../services/authService.js";
import { AuthRepository } from "../repositories/auth.repository.js";
import { OtpService } from "../services/otp.services.js";
import { EmailService } from "../services/email.service.js";
import { OtpRepository } from "../repositories/otp.repository.js";
import { OtpController } from "../controllers/otp.controller.js";

import { StudentAuthRepository } from "../repositories/studentAuth.repository.js";
import { MentorAuthRepository } from "../repositories/mentorAuth.repository.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";



const router = Router();



const authRepository = new AuthRepository();
const studentRepo = new StudentAuthRepository();   
const mentorRepo = new MentorAuthRepository(); 
const otpRepository = new OtpRepository();

const verificationRepositories = new Map<string, any>([
  ["student", studentRepo],
  ["mentor", mentorRepo],
]);

// const authRepositories: Map<string, IAuthRepository> = new Map([
//   ["student", studentRepo],
//   ["mentor", mentorRepo],
// ]);
const authRepositories: Map<string, IAuthRepository> = new Map<string, IAuthRepository>([
  ["student", studentRepo as IAuthRepository],
  ["mentor", mentorRepo as IAuthRepository],
]);



const emailService = new EmailService();
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
// router.post("/forgot-password/send-otp", authController.sendForgotPasswordOtp);
// router.post("/forgot-password/reset", authController.resetPassword);

export default router;
