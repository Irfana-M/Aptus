import { ApprovalStatus } from "../../domain/enums/ApprovalStatus";

export interface AcademicQualificationDto {
  institutionName: string;
  degree: string;
  graduationYear: string;
}

export interface ExperienceDto {
  institution: string;
  jobTitle: string;
  duration: string;
}

export interface SubjectProficiencyDto {
  subject: string;
  level: "basic" | "intermediate" | "expert";
}

export interface CertificationDto {
  name: string;
  issuingOrganization: string;
}

export interface MentorResponseDto {
  id: string;
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  location?: string | undefined;
  bio?: string | undefined;
  academicQualifications: AcademicQualificationDto[];
  experiences: ExperienceDto[];
  subjectProficiency: SubjectProficiencyDto[];
  certification: CertificationDto[];
  profilePicture?: string | undefined;
  profileImageUrl?: string | null | undefined;
  profileImageKey?: string | undefined;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  isProfileComplete: boolean;
  approvalStatus: ApprovalStatus;
  submittedForApprovalAt?: Date | undefined;
  rejectionReason?: string | undefined;
  authProvider?: "local" | "google" | undefined;
  googleId?: string | undefined;
}
