export interface BaseUser {
  _id: string; 
  email: string;
  password: string;
  role: 'mentor' | 'student';
  isVerified: boolean;
  isBlocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthUser extends BaseUser {
  fullName: string;
  phoneNumber: string;
  isProfileComplete?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected";
  id?: string;
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
  isPaid?: boolean;
  gradeLevel?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string; 
}