// services/authService.ts
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import type { IEmailService } from "../interfaces/services/IEmailService.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { LoginUserDto } from "../dto/LoginUserDTO.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import { hashPassword, comparePasswords } from "../utils/password.utils.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import type { IAuthService } from "../interfaces/services/IauthService.js";

export class AuthService implements IAuthService {
  constructor(
    private _authRepo: IAuthRepository,
    private _otpService: IOtpService,
    private _emailService: IEmailService,
    private _studentRepo: IStudentRepository,
    private _mentorRepo: IMentorRepository
  ) {}

  async registerUser(data: RegisterUserDto) {
    const existingUser = await this._authRepo.findByEmail(data.email);
    if (existingUser) throw new Error("User Already exists");

    if (data.password !== data.confirmPassword) throw new Error("Passwords do not match");

    const hashedPassword = await hashPassword(data.password);
    const user = await this._authRepo.createUser({ ...data, password: hashedPassword });

    await this.sendSignupOtp(user.email, data.role);

    return { message: "User registered. Please verify your email" };
  }

  async sendSignupOtp(email: string, role: "student" | "mentor"): Promise<void> {
    await this._otpService.generateAndSaveOtp(
      email,
      "signup",
      "email",
      new Date(Date.now() + 10 * 60 * 1000),
      role
    );
  }

  async verifySignupOtp(email: string, otp: string) {
    const savedOtp = await this._otpService.verifyOtp(email, "signup", otp);
    if (!savedOtp) throw new Error("Invalid or expired OTP");

    const role = savedOtp.role ?? (await this._authRepo.findByEmail(email))?.role;
    if (!role) throw new Error("Cannot determine user role");

    await (role === "student"
      ? this._studentRepo.markUserVerified(email)
      : this._mentorRepo.markUserVerified(email));

    await this._emailService.sendMail(
      email,
      "Welcome to Mentora",
      `<p>Your account has been verified successfully!</p>`
    );

    return true;
  }

  async loginUser({ email, password, role }: LoginUserDto) {
    const repo = role === "student" ? this._studentRepo : this._mentorRepo;
    const user = await repo.findByEmail(email);
    if (!user) throw new Error("User not found");

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, email: user.email, role: user.role });

    return { user, accessToken, refreshToken };
  }
  

  async markUserAsVerified(email: string, role: "student" | "mentor") {
    if (role === "student") await this._studentRepo.markUserVerified(email);
    else await this._mentorRepo.markUserVerified(email);
  }
}
