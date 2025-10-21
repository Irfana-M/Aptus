export interface VerifyOtpDto {
  email: string;
  otp: string;
  role: "student" | "mentor";
}