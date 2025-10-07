import type { LoginUserDto } from "../dto/LoginUserDTO.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import { hashPassword, comparePasswords } from "../utils/password.utils.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import { EmailService } from "./email.service.js";
import type { IAuthService } from "../interfaces/services/IauthService.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";

export class AuthService implements IAuthService{
  constructor(
    private _authRepository: IAuthRepository,
    private _otpService: IOtpService,
    private _emailService: EmailService,
    private _studentRepository: IStudentRepository,
    private _mentorRepository: IMentorRepository
  ) {}

  async registerUser(data: RegisterUserDto) {
    const existingUser = await this._authRepository.findByEmail(data.email);
    if(existingUser) throw new Error("User Already exists");

    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this._authRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    await this._otpService.generateAndSaveOtp(
      user.email,
      "signup",
      "email",
      new Date(Date.now() + 10 * 60 * 1000),
      (data.role as "student" | "mentor")
    );

    return { message: "User registered. Please verify your email" };
  }

  async sendSignupOtp(email: string, role: "student" | "mentor") {
    await this._otpService.generateAndSaveOtp(
      email,
      "signup",
      "email",
      new Date(Date.now() + 10 * 60 * 1000),
      role
    );
  }

  async verifySignupOtp(email: string, otp: string) {
    const savedOtp = await this._otpService.verifyOtp(
      email,
      "signup",
      otp,
      
    );
    if (!savedOtp) throw new Error("Invalid or expired OTP");

    let role = savedOtp.role;

    if (!role) {
      // fallback: try to determine role from user repository (compatibility)
      const existing = await this._authRepository.findByEmail(email);
      if (!existing || !existing.role) throw new Error("Cannot determine user role");
      role = existing.role as "student" | "mentor";
    }

    if (role === "student") {
      await this._studentRepository.markUserVerified(email);
    } else {
      await this._mentorRepository.markUserVerified(email);
    }


    return true;
  }

  async markUserAsVerified(email: string, role: "student" | "mentor"): Promise<void> {
  if (role === "student") {
    await this._studentRepository.markUserVerified(email);
  } else if (role === "mentor") {
    await this._mentorRepository.markUserVerified(email);
  }
}


  async loginUser(userData: LoginUserDto) {
    const { email, password, role} = userData;

    const repo = role === "student" ? this._studentRepository : this._mentorRepository;

    const user = await repo.findByEmail(email);
    if (!user) throw new Error("User not found");

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, email: user.email, role: user.role });
    return { user, accessToken, refreshToken };
  }

//   async sendForgotPasswordOtp(email: string) {
//     await this._otpService.generateAndSaveOtp(
//       email,
//       "forgotPassword",
//       "email",
//       new Date(Date.now() + 10 * 60 * 1000)
//     );
//   }

//   async resetpassword(
//     email: string,
//     otp: string,
//     password: string,
//     confirmPassword: string
//   ) {
//     const isValid = await this._otpService.verifyOtp(
//       email,
//       "forgotPassword",
//       otp
//     );

//     if (!isValid) throw new Error("Invalid or expired OTP");

//     if (password !== confirmPassword) {
//       throw new Error("Passwords do not match");
//     }

//     const hashedPassword = await hashPassword(password);

//     await this._authRepository.updatePassword(email, hashedPassword);

//     return { message: " Password reset successful" };
//   }
 }
