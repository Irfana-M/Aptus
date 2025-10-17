import type { Request, Response } from "express";
import type { IAuthService } from "../interfaces/services/IauthService.js";
import { studentRegisterSchema } from "../validations/authValidation/signup.validation.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";

export class AuthController {
  constructor(
    private _authService: IAuthService,
    private _otpService: IOtpService
  ) {}

  registerUser = async (req: Request, res: Response) => {
    try {
      const parsedData = studentRegisterSchema.parse(req.body);

      const result = await this._authService.registerUser({
        ...parsedData,
        role: req.body.role,
      });

      res.status(200).json({ success: true, message: result.message });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  // login = async (req: Request, res: Response) => {
  //   try {
  //     const { email, password, role } = req.body;
  //     if (!email || !password)
  //       throw new Error("Email and password are required");

  //     // const user = await this._authService.findUserByEmail(email);
  //     // if (!user) throw new Error("User not found");

  //     // if (user.role !== role) {
  //     //   throw new Error(
  //     //     `This email belongs to a ${user.role}. Please select the correct role.`
  //     //   );
  //     // }

  //     const { user, accessToken, refreshToken, isProfileComplete } = await this._authService.loginUser({
  //       email,
  //       password,
  //       role,
  //     });

  //     const authUser: AuthUser = { ... user };

  //     res.cookie("refreshToken", refreshToken, {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === "production",
  //       sameSite: "strict",
  //       maxAge: 7 * 24 * 60 * 60 * 1000,
  //     });


  //     res.status(200).json({ success: true, user, accessToken, isProfileComplete });
  //   } catch (error: any) {
  //     res.status(400).json({ success: false, message: error.message });
  //   }
  // };


// AuthController.ts - Fix the login response
login = async (req: Request, res: Response) => {
    try {
        const { email, password, role } = req.body;
        const { user, accessToken, refreshToken, isProfileComplete, isPaid } = await this._authService.loginUser({
            email,
            password,
            role,
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // Ensure consistent field names in response
        res.status(200).json({ 
            success: true, 
            user: {
                ...user,
                isProfileComplete,
                isPaid
            }, 
            accessToken, 
            isProfileComplete, 
            isPaid 
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};



  sendForgotPasswordOtp = async (req: Request, res: Response) => {
    try {
      const { email, role } = req.body;
      if (!email) throw new Error("Email is required");
      if (!role || !["student", "mentor"].includes(role))
        throw new Error("Role is required");

      await this._authService.sendForgotPasswordOtp(email,role);
      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  resetPassword = async (req: Request, res: Response) => {
    const { otp, password, confirmPassword } = req.body;
    if (!otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otpData = await this._otpService.findByOtp(otp, "forgotPassword");
    if (!otpData)
      return res.status(400).json({ message: "Invalid or expired OTP" });

    const email = otpData.email;
    await this._authService.resetPassword(
      email,
      otp,
      password,
      confirmPassword
    );

    return res.status(200).json({ message: "Password reset successful" });
  };


}
