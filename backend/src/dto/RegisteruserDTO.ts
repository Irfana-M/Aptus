export interface RegisterUserDto {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    role: 'mentor' | 'student';
    isVerified?: boolean;
}