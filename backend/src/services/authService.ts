import type { LoginUserDto } from "../dto/LoginUserDTO";
import type { RegisterUserDto } from "../dto/RegisteruserDTO";
import type { IAuthRepository } from "../interfaces/IAuthRepository";
import { hashPassword, comparePasswords } from "../utils/password.utils";
import type { IOtpService } from "../interfaces/IOtpService";
import { generateToken } from "../utils/jwt.util";
import { EmailService } from "./email.service";

export class AuthService {
    constructor(
        private authRepository: IAuthRepository,
        private otpService: IOtpService,
        private emailService: EmailService
    ) {}

   async registerUser(data: RegisterUserDto) {

    if(data.password !== data.confirmPassword) {
        throw new Error("Passwords do not match");
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await this.authRepository.createUser({
        ...data,
        password: hashedPassword,
    })

   
    await this.emailService.sendMail(user.email, "Verify your email", "<OTP>");
    return {message: "User registered. Please verify your email"};
}


    async sendSignupOtp(email: string) {
        await this.otpService.generateAndSaveOtp(
            email,
            "signup",
            "email",
            new Date(Date.now() + 10 * 60 * 1000)
        );
    }

    async verifySignupOtp(otp: string, userData: RegisterUserDto) {
         const isValid = await this.otpService.verifyOtp(
            userData.email,
            "signup",
            otp
        );
        if(!isValid) throw new Error("Invalid or expired OTP");

        if(userData.password !== userData.confirmPassword) {
            throw new Error('passwords do not match');
        }

        const hashedPassword = await hashPassword(userData.password);
        const user =await  this.authRepository.createUser({
            ...userData,
            password: hashedPassword
        });

        const token = generateToken({id:user._id, role: user.role});
        return {user, token};
    }


    async loginUser(userData: LoginUserDto) {
        const user = await this.authRepository.findUserByEmail(userData.email);
        if(!user) throw new Error("User not found");

        const isMatch = await comparePasswords(userData.password, user.password);
        if(!isMatch) throw new Error("Invalid credentials");
        
        const token = generateToken({id: user._id,role: user.role});
        return {user, token}; 
    }

    async sendForgotPasswordOtp(email: string) {
        await this.otpService.generateAndSaveOtp(
            email,
            "forgotPassword",
            "email",
            new Date(Date.now() + 10 * 60 * 1000)
        );
    }

    async resetpassword(
        email: string,
        otp: string,
        password: string,
        confirmPassword: string
    ) {
        const isValid = await this.otpService.verifyOtp(
            email,
            "forgotPassword",
            otp);

            if(!isValid) throw new Error("Invalid or expired OTP");

            if(password !== confirmPassword) {
                throw new Error("Passwords do not match");
            }

            const hashedPassword = await hashPassword(password);

            await this.authRepository.updatePassword(email,hashedPassword)
    }
    
}
