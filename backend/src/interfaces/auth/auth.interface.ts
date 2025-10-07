export interface AuthUser {
    _id: string;
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: 'student' | 'mentor';
    isVerified: boolean;
}