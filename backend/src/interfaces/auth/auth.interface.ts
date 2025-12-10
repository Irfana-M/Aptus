export interface BaseUser {
  _id: string; 
  email: string;
  password: string;
  role: 'mentor' | 'student';
  isVerified: boolean;
  isBlocked?: boolean | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AuthUser extends BaseUser {
  fullName: string;
  phoneNumber: string;
  isProfileComplete?: boolean | undefined;
  approvalStatus?: "pending" | "approved" | "rejected";
  id?: string | undefined;
}


export interface MentorAuthUser extends Omit<AuthUser, 'role'> {
  role: "mentor"; 
  academicQualifications?: { 
    institutionName: string; 
    degree: string; 
    graduationYear: string 
  }[] | undefined;
  subjectProficiency?: { 
    subject: string; 
    level: string 
  }[] | undefined;
  profilePicture?: string | undefined;
  profileImageUrl?: string | undefined;
}

export interface StudentAuthUser extends Omit<AuthUser, 'role'> {
  role: "student";
  isPaid?: boolean | undefined;
  gradeLevel?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string; 
  isTrialCompleted?: boolean;
  isProfileCompleted?: boolean;
}