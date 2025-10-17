// // interfaces/auth/auth.interface.ts
export interface AuthUser {
    _id: string;
    fullName: string;
    email: string;
    password: string;
    phoneNumber: string;
    role: 'student' | 'mentor';
    isVerified: boolean;
    isProfileComplete?: boolean; 
    isPaid?: boolean;  // Change from hasPaid to isPaid for consistency
}

export interface MentorAuthUser extends AuthUser {
  role: "mentor";
  academicQualification?: { institutionName: string; degree: string; graduationYear: string }[];
  subjectProficiency?: { subject: string; level: string }[];
}

export interface StudentAuthUser extends AuthUser {
  isPaid?: boolean;  // Change from hasPaid to isPaid
  role: "student";
  academicDetails?: { institutionName: string; grade: string; syllabus: string };
  contactInfo?: { parentInfo: { name: string; email: string; phoneNumber: string }; address?: string };
}