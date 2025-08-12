export interface IOtp {
    email: string;
    otp: string;
    deliveryMethod: "email";
    otpPurpose: "signup" | "forgotPassword";
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}