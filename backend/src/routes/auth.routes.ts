import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/authService";
import { AuthRepository } from "../repositories/auth.repository";
import { OtpService } from "../services/otp.services";
import { EmailService } from "../services/email.service";
import { OtpRepository } from "../repositories/otp.repository";



const router = Router();


const authRepository = new AuthRepository();
const otpRepository = new OtpRepository();
const emailService = new EmailService();
const otpService = new OtpService(otpRepository, emailService);
const authService = new AuthService(authRepository, otpService, emailService);
const authController = new AuthController(authService);


router.post("/signup", authController.registerUser);
router.post("/signup/verify", authController.verifySignupOtp);
router.post("/login", authController.login);
router.post("/forgot-password/send-otp", authController.sendForgotPasswordOtp);
router.post("/forgot-password/reset", authController.resetPassword);

export default router;
