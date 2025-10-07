export interface StudentRegisterInput {
  fullName: string;
  email: string;
  phoneNUmber: string;
  password: string;
  confirmPassword: string;
}

export interface StudentDBInput {
  fullName: string;
  email: string;
  phoneNUmber: string;
  password: string;
  isBlocked?: boolean;
}

export interface StudentOtp extends StudentRegisterInput{
  otp?: string;
  otpExpiresAt?: Date;
  isVerified?: boolean;
}

export interface ParentInfo {
     name: string;
     email: string;
     phoneNumber:string;
}

export interface contactInfo {
     parentInfo: ParentInfo;
     address: string;
     country: string;
     postalCode: string;
}

export interface AcademicDetails {
     institutionName: string;
     grade: string;
     syllabus: string;
}

export interface StudentProfile {
     _id: string;
     fullName: string;
     email: string;
     phoneNumber: string;
     password: string;
     age: number;
     gender: string;
     dateOfBirth: Date;
     contactInfo: contactInfo;
     academicDetails: AcademicDetails;
     profileImage: string;
     goal?: string;
     isVerified?: boolean;
     isBlocked: boolean;
     createdAt?: Date;
     updatedAt?: Date;
}

