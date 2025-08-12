export interface AuthUser {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    role: 'student' | 'mentor';
    isVerified: boolean;
}