import type { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { studentRegisterSchema } from "../validations/authValidation/signup.validation";

export class AuthController {
  constructor(private authService: AuthService) {}

  
  registerUser = async (req: Request, res: Response) => {
    try {

      const parsedData = studentRegisterSchema.parse(req.body);
      
      const result = await this.authService.registerUser({
        ...parsedData,
        role: req.body.role});

      res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  
  verifySignupOtp = async (req: Request, res: Response) => {
    try {
      const { email, otp } = req.body;
      if(!email || !otp) throw new Error("Email and OTP are required");

      const result = await this.authService.verifySignupOtp(email,otp);
      res.status(201).json({ success: true, user: result.user, token: result.token });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  
  login = async (req: Request, res: Response) => {
    try {
      const { email, password, role } = req.body;
      if (!email || !password) throw new Error("Email and password are required");

      const { user, token } = await this.authService.loginUser({ email, password, role });
      res.status(200).json({ success: true, user, token });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  
  sendForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) throw new Error("Email is required");

      await this.authService.sendForgotPasswordOtp(email);
      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  
  resetPassword = async (req: Request, res: Response) => {
    try {
      const { email, otp, password, confirmPassword } = req.body;
      if (!email || !otp || !password || !confirmPassword)
        throw new Error("All fields are required");

      await this.authService.resetpassword(email, otp, password, confirmPassword);
      res.status(200).json({ success: true, message: "Password reset successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };
}
