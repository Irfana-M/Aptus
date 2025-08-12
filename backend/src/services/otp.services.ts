import type { IOtpService } from "../interfaces/IOtpService";
import { OtpRepository } from "../repositories/otp.repository";
import { generateRandomOtp } from "../utils/otp.utils";
import type { IOtp } from "../interfaces/otp.interface";
import { EmailService } from "./email.service";

export class OtpService implements IOtpService {
     constructor(
        private otpRepository: OtpRepository,
        private emailService: EmailService
     ){}

    async generateAndSaveOtp(
        email: string, 
        otpPurpose: "signup" | "forgotPassword",
        deliveryMethod: "email" | "phone",
        expiresAt: Date
    ): Promise<IOtp> {
        const otp = generateRandomOtp();

        return await this.otpRepository.saveOtp(
            email,
            otp,
            otpPurpose,
            expiresAt,
            deliveryMethod
        );
    }


    async verifyOtp(
        email: string,
        otpPurpose: "signup" | "forgotPassword",
        enteredOtp: string
    ): Promise<boolean> {

        const savedOtp = await this.otpRepository.findOtp(email, otpPurpose);
        if(!savedOtp) return false;

        if(savedOtp.expiresAt < new Date()) {
            await this.otpRepository.deleteOtp(email, otpPurpose);
            return false;
        }

        if(savedOtp.otp !== enteredOtp) return false;

        await this.otpRepository.deleteOtp(email, otpPurpose);
        return true;
    }

}