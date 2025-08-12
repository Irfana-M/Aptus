export interface MentorRegisterInput {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface MentorDBInput {
   _id?: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  isBlocked?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentOtp extends MentorRegisterInput{
  otp?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;
}

export interface AcademicQualification {
     institutionName: string;
     degree: string;
     graduationYear: string;
}

export interface Experience {
     institution: string;
     jobTitle: string;
     duration: string;
}

export interface SubjectProficency {
    subject: string;
    level: "basic" | "intermediate" | "expert";
}

export interface Certification {
    name: string;
    IssuingOrganization: string;
}

export interface MentorProfile {
     _id: string;
     fullName: string;
     email: string;
     password: string;
     phone: string;
     location?: string;
     bio?: string;
     academicQualification?: AcademicQualification[];
     experience?: Experience[];
     subjectProficiency?: SubjectProficency;
     certification?: Certification[];
     profileMediaUrl?: string;
     isVerified?: boolean;
     isBlocked: boolean;
     createdAt?: Date;
     updatedAt?: Date;
}

