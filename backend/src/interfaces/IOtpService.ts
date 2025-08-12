import type { IOtp } from "./otp.interface";

export interface IOtpService {
    generateAndSaveOtp(
        email: string,
        otpPurpose: "signup" | "forgotPassword",
        deliveryMethod: "email",
        expiresAt: Date
    ): Promise<IOtp>;

    verifyOtp(
        email: string,
        otpPurpose: "signup"|"forgotPassword",
        otp: string
    ): Promise<boolean>;
}