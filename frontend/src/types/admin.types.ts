import type { MentorProfile } from "../features/mentor/types";
import type { StudentBaseResponseDto, CourseRequest } from "./student.types";
import type { Course, Subject } from "./course.types";

export type { MentorProfile, StudentBaseResponseDto, Course, Subject, CourseRequest };

export interface AddStudentRequestDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface AddStudentResponseDto {
  success: boolean;
  message: string;
  data: StudentBaseResponseDto;
}

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



export interface AvailableMentor {
  _id: string;
  id: string; 
  fullName: string;
  email: string;
  phoneNumber: string;
  location?: string;
  bio?: string;
  academicQualifications: AcademicQualificationDto[];
  experiences: ExperienceDto[];
  subjectProficiency: SubjectProficiencyDto[];
  certification: CertificationDto[];
  profilePicture?: string;
  profileImageUrl?: string | null;
  profileImageKey?: string;
  availability?: {
    dayOfWeek: number;
    timeSlots: string[];
    timezone: string;
  }[];
  rating?: number;
  expertise?: string[];
  isActive?: boolean;
  isVerified: boolean;
  isBlocked: boolean;
  isProfileComplete: boolean;
  approvalStatus: "pending" | "approved" | "rejected";
  authProvider?: "local" | "google";
  googleId?: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface AdminMentorProfile extends MentorProfile {
  studentsCount?: number;
  averageRating?: number;
  totalCompletedSessions?: number;
}

export const hasAdminProperties = (
  mentor: MentorProfile
): mentor is AdminMentorProfile => {
  return "studentsCount" in mentor || "averageRating" in mentor;
};

export interface MentorAssignmentRequest {
  trialClassId: string;
  mentorId: string;
  scheduledDate: string;
  scheduledTime: string;
}


export interface AvailableMentorsRequest {
  subjectId: string;
  preferredDate: string;
}


export interface AdminEnrollment {
  _id: string;
  id: string;
  student: StudentBaseResponseDto | string;
  course: Course | string;
  status: 'active' | 'completed' | 'cancelled';
  enrolledAt: string;
}

export interface MentorRequestListItem {
  _id: string;
  id: string;
  student: StudentBaseResponseDto | string;
  mentor?: MentorProfile | string;
  subject?: { _id: string; subjectName: string } | string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: string;
}

