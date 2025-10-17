import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { IOtpService } from "../interfaces/services/IOtpService.js";
import type { IEmailService } from "../interfaces/services/IEmailService.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { LoginUserDto } from "../dto/LoginUserDTO.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import { hashPassword, comparePasswords } from "../utils/password.utils.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";
import type { IAuthService } from "../interfaces/services/IauthService.js";
import type { AuthUser, MentorAuthUser, StudentAuthUser } from "../interfaces/auth/auth.interface.js";

export class AuthService implements IAuthService {
  private _authRepository: any;
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

    if (data.password !== data.confirmPassword)
      throw new Error("Passwords do not match");

    const hashedPassword = await hashPassword(data.password);
    const user = await this._authRepo.createUser({
      ...data,
      password: hashedPassword,
    });

    await this.sendSignupOtp(user.email, data.role);

    return { message: "User registered. Please verify your email" };
  }

  async sendSignupOtp(
    email: string,
    role: "student" | "mentor"
  ): Promise<void> {
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

    const role =
      savedOtp.role ?? (await this._authRepo.findByEmail(email))?.role;
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

//   async loginUser({ email, password, role }: LoginUserDto) {
//     const repo = role === "student" ? this._studentRepo : this._mentorRepo;
//     const user = role === "mentor"
//     ? (await repo.findByEmail(email)) as MentorAuthUser
//     : (await repo.findByEmail(email)) as StudentAuthUser;
//     if (!user) throw new Error("User not found");

//     const isMatch = await comparePasswords(password, user.password);
//     if (!isMatch) throw new Error("Invalid credentials");

//      let isProfileComplete = false
     
// if (role === "mentor") {
//     const mentorUser = user as MentorAuthUser; 
//     isProfileComplete = Boolean(
//       mentorUser.fullName &&
//         mentorUser.academicQualification?.length &&
//         mentorUser.subjectProficiency?.length
//     );
//   } else {
//     const studentUser = user as StudentAuthUser; 
//     isProfileComplete = Boolean(
//       studentUser.fullName &&
//         studentUser.academicDetails?.institutionName &&
//         studentUser.contactInfo?.parentInfo?.name
//     );
//   }

//     const accessToken = generateAccessToken({
//       id: user._id,
//       email: user.email,
//       role: user.role,
//     });
//     const refreshToken = generateRefreshToken({
//       id: user._id,
//       email: user.email,
//       role: user.role,
//     });

//     return { user, accessToken, refreshToken };
//   }

// AuthService.ts - Fix the loginUser method
// AuthService.ts - Remove the hasPaid reference
async loginUser({ email, password, role }: LoginUserDto) {
    const repo = role === "student" ? this._studentRepo : this._mentorRepo;
    const user = await repo.findByEmail(email);
    if (!user) throw new Error("User not found");

    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const accessToken = generateAccessToken({ id: user._id, email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id, email: user.email, role: user.role });

    const isProfileComplete = this.checkProfileComplete(user, role);

    let isPaid: boolean | undefined = undefined;
    if (role === "student") {
        isPaid = await this.checkIsPaid(email);
    }

    // Create a clean user response object
    const userResponse = {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        isProfileComplete,
        isPaid
    };

    return { 
        user: userResponse, 
        accessToken, 
        refreshToken, 
        isProfileComplete, 
        isPaid 
    };
}

private checkProfileComplete(user: MentorAuthUser | StudentAuthUser, role: "mentor" | "student") {
    if (role === "mentor") {
        const mentor = user as MentorAuthUser;
        return Boolean(
            mentor.fullName &&
            mentor.academicQualification?.length &&
            mentor.subjectProficiency?.length
        );
    } else {
        const student = user as StudentAuthUser;
        return Boolean(
            student.fullName &&
            student.academicDetails?.institutionName &&
            student.contactInfo?.parentInfo?.name
        );
    }
}

async checkIsPaid(email: string): Promise<boolean> {
    const student = await this._studentRepo.findByEmail(email);
    if (!student) throw new Error("Student not found");
    
    // Only use isPaid since hasPaid doesn't exist in the interface
    const studentData = student as StudentAuthUser;
    return Boolean(studentData.isPaid); // Remove the hasPaid reference
}

  async sendForgotPasswordOtp(
    email: string,
    role: "student" | "mentor"
  ): Promise<void> {
    const repo = role === "student" ? this._studentRepo : this._mentorRepo;

    const user = await repo.findByEmail(email);
    if (!user) throw new Error(`No ${role} account found with this email`);

    const savedOtp = await this._otpService.generateAndSaveOtp(
      email,
      "forgotPassword",
      "email",
      new Date(Date.now() + 10 * 60 * 1000),
      role
    );

    await this._emailService.sendMail(
      email,
      "Mentora Password Reset OTP",
      `<p>Your password reset OTP is <b>${savedOtp.otp}</b>. It expires in 10 minutes.</p>`
    );
  }

  async resetPassword(
    email: string,
    otp: string,
    password: string,
    confirmPassword: string
  ): Promise<void> {
    if (password !== confirmPassword) throw new Error("Passwords do not match");

    const verifiedOtp = await this._otpService.verifyOtp(
      email,
      "forgotPassword",
      otp
    );
    if (!verifiedOtp) throw new Error("Invalid or expired OTP");

    const hashedPassword = await hashPassword(password);
    await this._authRepo.updatePassword(email, hashedPassword);
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    return this._authRepository.findByEmail(email);
  }


}
