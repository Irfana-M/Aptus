export interface BaseUser {
  _id: string;
  email: string;
  fullName: string;
  password: string;
  phoneNumber: string;
  role: 'student' | 'mentor';
  isVerified: boolean;
  isProfileComplete: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MentorProfile extends BaseUser {
  role: 'mentor';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  academicQualifications?: {
    institutionName: string;
    degree: string;
    graduationYear: string;
  }[];
  subjectProficiency?: {
    subject: string;
    level: string;
  }[];
  profilePicture?: string;
  rejectionReason?: string;
  submittedForApprovalAt?: Date;
}

export interface StudentProfile extends BaseUser {
  role: 'student';
  isPaid: boolean;
  gradeLevel?: string;
  school?: string;
  parentName?: string;
  parentPhone?: string;
}