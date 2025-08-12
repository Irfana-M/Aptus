export interface User {
  email: string;
  fullName?: string;
  password?: string;
  confirmPassword?: string;
  mobileNumber?: string;
  otp?: string;
  role?: 'student' | 'mentor';
}
export interface OtpData {
  email: string;
  otp: string;
  resendCount: number;
}