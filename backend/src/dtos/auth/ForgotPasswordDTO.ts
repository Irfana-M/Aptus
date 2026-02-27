export interface ForgotPasswordDto {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
  role: "mentor" | "student";
}
