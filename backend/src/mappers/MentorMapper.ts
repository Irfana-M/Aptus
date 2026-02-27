import type {
  MentorProfile,
  AcademicQualification,
  Experience,
  SubjectProficency,
  Certification,
} from "../interfaces/models/mentor.interface";
import type {
  MentorResponseDto,
  AcademicQualificationDto,
  ExperienceDto,
  SubjectProficiencyDto,
  CertificationDto,
} from "../dtos/mentor/MentorResponseDTO";
import { ApprovalStatus } from "@/domain/enums/ApprovalStatus";
export class MentorMapper {
  static toResponseDto(mentor: MentorProfile): MentorResponseDto {
    const mentorData = (mentor && 'toObject' in mentor && typeof mentor.toObject === 'function') 
      ? (mentor as { toObject: () => MentorProfile }).toObject() 
      : mentor as MentorProfile;
    console.log("🔍 Mapper - Processing mentor:", {
      id: mentorData._id,
      profileImageUrl: mentorData.profileImageUrl,
      profileImageKey: mentorData.profileImageKey,
    });

    return {
      id: mentorData._id.toString(),
      _id: mentorData._id.toString(),
      fullName: mentorData.fullName,
      email: mentorData.email,
      phoneNumber: mentorData.phoneNumber,
      location: mentorData.location,
      bio: mentorData.bio,
      academicQualifications: this.mapAcademicQualifications(
        mentorData.academicQualifications
      ),
      experiences: this.mapExperiences(mentorData.experiences),
      subjectProficiency: this.mapSubjectProficiency(
        mentorData.subjectProficiency
      ),
      certification: this.mapCertifications(mentorData.certification),
      profilePicture: mentorData.profilePicture,
      profileImageUrl: mentorData.profileImageUrl,
      profileImageKey: mentorData.profileImageKey,
      isVerified: mentorData.isVerified ?? false,
      isBlocked: mentorData.isBlocked ?? false,
      createdAt: mentorData.createdAt || new Date(),
      updatedAt: mentorData.updatedAt || new Date(),
      isProfileComplete: mentorData.isProfileComplete ?? false,
      approvalStatus: mentorData.approvalStatus || ApprovalStatus.PENDING,
      submittedForApprovalAt: mentorData.submittedForApprovalAt,
      rejectionReason: mentorData.rejectionReason,
      authProvider: mentorData.authProvider,
      googleId: mentorData.googleId,
    };
  }

  private static mapAcademicQualifications(
    qualifications?: AcademicQualification[]
  ): AcademicQualificationDto[] {
    return (
      qualifications?.map((qual) => ({
        institutionName: qual.institutionName,
        degree: qual.degree,
        graduationYear: qual.graduationYear,
      })) || []
    );
  }

  private static mapExperiences(experiences?: Experience[]): ExperienceDto[] {
    return (
      experiences?.map((exp) => ({
        institution: exp.institution,
        jobTitle: exp.jobTitle,
        duration: exp.duration,
      })) || []
    );
  }

  private static mapSubjectProficiency(
    proficiency?: SubjectProficency[]
  ): SubjectProficiencyDto[] {
    return (
      proficiency?.map((subj) => ({
        subject: subj.subject,
        level: subj.level,
      })) || []
    );
  }

  private static mapCertifications(
    certifications?: Certification[]
  ): CertificationDto[] {
    return (
      certifications?.map((cert) => ({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
      })) || []
    );
  }

  static toResponseDtoList(mentors: MentorProfile[]): MentorResponseDto[] {
    return mentors.map((mentor) => this.toResponseDto(mentor));
  }
}
