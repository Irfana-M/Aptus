export interface RegisterUserDto {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    role: 'mentor' | 'student';
    isVerified?: boolean;
}
