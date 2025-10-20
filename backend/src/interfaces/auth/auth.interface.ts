export interface AuthUser {
    _id: string;
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: 'student' | 'mentor';
    isVerified: boolean;
    isProfileComplete?: boolean | undefined; 
    isPaid?: boolean | undefined;
    id?: string | undefined; 
}
export interface MentorAuthUser extends AuthUser {
  role: "mentor";
  academicQualification?: { institutionName: string; degree: string; graduationYear: string }[] | undefined;
  subjectProficiency?: { subject: string; level: string }[] | undefined;
}

export interface StudentAuthUser extends AuthUser {
  isPaid?: boolean; 
  role: "student";
}