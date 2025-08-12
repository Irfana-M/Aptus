import api from "../api/axios";
export interface User {
  email: string;
  firstName?: string;
  password?: string;
  confirmPassword?: string;
  mobileNumber?: string;
  role?: 'student' | 'mentor';
  otp?: string;
}

export class UserRepository {
  
  static async register(userData: User): Promise<{ success: boolean; message: string }> {
    return api.post("/auth/signup", userData);
  }
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    return password.length >= 6;
  }

  static validateMobile(mobile: string): boolean {
    const mobileRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return mobileRegex.test(mobile);
  }

  static validateOTP(otp: string): boolean {
    return otp.length === 6 && /^\d+$/.test(otp);
  }

  static validateRole(role: string): boolean {
    return ['student', 'mentor'].includes(role);
  }


}