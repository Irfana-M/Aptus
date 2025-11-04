export interface IOtp {
  email: string;
  otp: string;
  deliveryMethod: "email";
  otpPurpose: "signup" | "forgotPassword";
  expiresAt: Date;
  role?: "student" | "mentor";
  createdAt: Date;
  updatedAt: Date;
}
