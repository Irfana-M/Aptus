export interface IOtpRepository {
    saveOtp(email: string, otp: string): Promise<void>;
    verifyOtp(email: string, otp: string): Promise<boolean>;
}