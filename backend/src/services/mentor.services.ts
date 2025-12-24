import { injectable, inject } from 'inversify';
import type {
  IMentorRepository,
} from "../interfaces/repositories/IMentorRepository";
import type { ITrialClassRepository } from "../interfaces/repositories/ITrialClassRepository";
import type { IMentorAuthRepository } from '@/interfaces/repositories/IMentorAuthRepository';
import type { AuthUser } from "../interfaces/auth/auth.interface";
import type { IEmailService } from "../interfaces/services/IEmailService";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import type { IMentorService } from "../interfaces/services/IMentorService";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { uploadFileToS3 } from "../utils/s3Upload";
import { TYPES } from '../types';
import type { RegisterUserDto } from '@/dto/auth/RegisteruserDTO';
import type { MentorResponseDto } from '@/dto/mentor/MentorResponseDTO';
import { MentorMapper } from '@/mappers/MentorMapper';
import { TrialClassMapper } from '@/mappers/trialClassMapper';
import type { TrialClassResponseDto } from "@/dto/student/trialClassDTO";

@injectable()
export class MentorService implements IMentorService {
  constructor(
    @inject(TYPES.IMentorAuthRepository) private _mentorAuthRepo: IMentorAuthRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.ITrialClassRepository) private _trialClassRepo: ITrialClassRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService
  ) {}


  async registerMentor(data: RegisterUserDto): Promise<AuthUser> {
    try {
      logger.info(`Registering new mentor with email: ${data.email}`);

      const existingMentor = await this._mentorAuthRepo.findByEmail(data.email);
      if (existingMentor) {
        logger.warn(
          `Mentor registration failed - Email already exists: ${data.email}`
        );
        throw new Error("Mentor with this email already exists");
      }

      const mentor = await this._mentorAuthRepo.createUser(data);
      logger.info(`Mentor registered successfully: ${mentor.email}`);

      return mentor;
    } catch (error: unknown) {
      logger.error(
        `Error in registerMentor for email ${data.email}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async updateMentorProfile(
    mentorId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any
  ): Promise<MentorProfile> {
    try {
      logger.info(`Starting profile update for mentor: ${mentorId}`);

      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) {
        logger.error(`Mentor not found for profile update: ${mentorId}`);
        throw new Error("Mentor not found");
      }

      const updateData: Partial<MentorProfile> = {
        fullName: data.fullName || mentor.fullName,
        email: data.email || mentor.email,
        phoneNumber: data.phoneNumber || mentor.phoneNumber,
        location: data.location || mentor.location,
        bio: data.bio || mentor.bio,
        isProfileComplete:
          data.isProfileComplete !== undefined
            ? data.isProfileComplete === "true"
            : mentor.isProfileComplete ?? false,
      };

      logger.debug(`Processing update data for mentor: ${mentorId}`, {
        updateData,
      });

      if (data.academicQualifications) {
        try {
          updateData.academicQualifications =
            typeof data.academicQualifications === "string"
              ? JSON.parse(data.academicQualifications)
              : data.academicQualifications;
          logger.debug(
            `Processed academic qualifications for mentor: ${mentorId}`
          );
        } catch (parseError) {
          logger.error(
            `Error parsing academicQualifications for mentor ${mentorId}: ${parseError}`
          );
          throw new Error("Invalid academic qualifications format");
        }
      }

      if (data.experiences) {
        try {
          updateData.experiences =
            typeof data.experiences === "string"
              ? JSON.parse(data.experiences)
              : data.experiences;
          logger.debug(`Processed experiences for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing experiences for mentor ${mentorId}: ${parseError}`
          );
          throw new Error("Invalid experiences format");
        }
      }

      if (data.subjectProficiency) {
        try {
          updateData.subjectProficiency =
            typeof data.subjectProficiency === "string"
              ? JSON.parse(data.subjectProficiency)
              : data.subjectProficiency;
          logger.debug(`Processed subject proficiency for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing subjectProficiency for mentor ${mentorId}: ${parseError}`
          );
          throw new Error("Invalid subject proficiency format");
        }
      }

      if (data.certification) {
        try {
          updateData.certification =
            typeof data.certification === "string"
              ? JSON.parse(data.certification)
              : data.certification;
          logger.debug(`Processed certifications for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing certification for mentor ${mentorId}: ${parseError}`
          );
          throw new Error("Invalid certification format");
        }
      }

      if (data.availability) {
        try {
          updateData.availability =
            typeof data.availability === "string"
              ? JSON.parse(data.availability)
              : data.availability;
          logger.debug(`Processed availability for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing availability for mentor ${mentorId}: ${parseError}`
          );
          throw new Error("Invalid availability format");
        }
      }

      if (data.profilePicture) {
        try {
          updateData.profilePicture = await this.handleProfilePictureUpload(
            data.profilePicture
          );
          logger.debug(`Processed profile picture for mentor: ${mentorId}`);
        } catch (uploadError: unknown) {
          logger.error(
            `Error uploading profile picture for mentor ${mentorId}: ${getErrorMessage(uploadError)}`
          );
          throw new Error(
            `Failed to upload profile picture: ${getErrorMessage(uploadError)}`
          );
        }
      }

      const updatedMentor = await this._mentorRepo.updateProfile(
        mentorId,
        updateData
      );
      if (!updatedMentor) {
        logger.error(
          `Failed to update mentor profile in repository: ${mentorId}`
        );
        throw new Error("Failed to update mentor profile");
      }

      logger.info(`Mentor profile updated successfully: ${mentorId}`);
      return updatedMentor;
    } catch (error: unknown) {
      logger.error(
        `Error in updateMentorProfile for mentor ${mentorId}: ${getErrorMessage(error)}`
      );
      throw new Error(`Failed to update mentor profile: ${getErrorMessage(error)}`);
    }
  }

  async submitProfileForApproval(
    mentorId: string,
    _requestingUserId: string
  ): Promise<{ message: string }> {
    const mentor = await this._mentorRepo.findById(mentorId);
    if (!mentor) throw new Error("Mentor not found");
    if (!mentor.isProfileComplete)
      throw new Error("Complete profile before submitting for approval");

    await this._mentorRepo.submitForApproval(mentorId);

    return { message: "Profile submitted for approval" };
  }

  async getPendingMentors() {
    return this._mentorRepo.getPendingApprovals();
  }

  async approveMentor(
    mentorId: string,
    adminId: string
  ): Promise<{ message: string }> {
    try {
      logger.info(`Approving mentor - Mentor: ${mentorId}, Admin: ${adminId}`);

      const updatedMentor = await this._mentorRepo.updateApprovalStatus(
        mentorId,
        "approved"
      );
      if (!updatedMentor) {
        logger.error(`Mentor not found for approval: ${mentorId}`);
        throw new Error("Mentor not found");
      }

      try {
        await this._emailService.sendMail(
          updatedMentor.email,
          "Aptus - Your Mentor Profile is Approved",
          `<p>Hi ${updatedMentor.fullName},</p>
          <p>Congratulations — your mentor profile has been approved by our admin team.</p>
          <p>You can now access all mentor features and start helping students.</p>
          <br>
          <p>Best regards,<br>The Aptus Team</p>`
        );
        logger.info(
          `Approval email sent successfully to: ${updatedMentor.email}`
        );
      } catch (emailError: unknown) {
        logger.warn(
          `Failed to send approval email to ${updatedMentor.email}: ${getErrorMessage(emailError)}`
        );
      }

      logger.info(`Mentor approved successfully: ${mentorId}`);
      return { message: "Mentor approved and notification sent" };
    } catch (error: unknown) {
      logger.error(
        `Error in approveMentor for mentor ${mentorId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async rejectMentor(
    mentorId: string,
    reason: string,
    adminId: string
  ): Promise<{ message: string }> {
    try {
      logger.info(
        `Rejecting mentor - Mentor: ${mentorId}, Admin: ${adminId}, Reason: ${reason}`
      );

      const updatedMentor = await this._mentorRepo.updateApprovalStatus(
        mentorId,
        "rejected",
        reason
      );
      if (!updatedMentor) {
        logger.error(`Mentor not found for rejection: ${mentorId}`);
        throw new Error("Mentor not found");
      }

      try {
        await this._emailService.sendMail(
          updatedMentor.email,
          "Aptus - Mentor Profile Review Update",
          `<p>Hi ${updatedMentor.fullName},</p>
          <p>Thank you for submitting your mentor profile for review.</p>
          <p>After careful consideration, we are unable to approve your profile at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please review your profile, make the necessary updates, and resubmit for approval.</p>
          <br>
          <p>Best regards,<br>The Aptus Team</p>`
        );
        logger.info(
          `Rejection email sent successfully to: ${updatedMentor.email}`
        );
      } catch (emailError: unknown) {
        logger.warn(
          `Failed to send rejection email to ${updatedMentor.email}: ${getErrorMessage(emailError)}`
        );
      }

      logger.info(`Mentor rejected successfully: ${mentorId}`);
      return { message: "Mentor rejected and notification sent" };
    } catch (error: unknown) {
      logger.error(
        `Error in rejectMentor for mentor ${mentorId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async handleProfilePictureUpload(file: any): Promise<string> {
    try {
      logger.debug("Handling profile picture upload:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      if (!file) throw new Error("No file provided for profile picture");

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.mimetype}`);
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error("File too large (max 5MB)");

      const imageUrl = await uploadFileToS3(file);

      logger.info(`Profile picture uploaded successfully to S3: ${imageUrl}`);
      return imageUrl;
    } catch (error: unknown) {
      logger.error(`Error uploading profile picture: ${getErrorMessage(error)}`);
      throw new Error(`Failed to upload profile picture: ${getErrorMessage(error)}`);
    }
  }

  async getMentorTrialClasses(mentorId: string): Promise<TrialClassResponseDto[]> {
    try {
      logger.info(`Fetching trial classes for mentor: ${mentorId}`);
      const trialClasses = await this._trialClassRepo.findByMentorId(mentorId);
      return trialClasses.map(token => TrialClassMapper.toResponseDto(token));
    } catch (error: unknown) {
      logger.error(`Error in getMentorTrialClasses for mentor ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

   async getById(id: string): Promise<MentorResponseDto | null> {
    const mentor = await this._mentorRepo.findById(id);
    if (!mentor) return null;
    return MentorMapper.toResponseDto(mentor);
  }

  async getMentorProfile(mentorId: string): Promise<MentorProfile | null> {
    try {
      logger.info(`Fetching mentor profile via service: ${mentorId}`);
      const mentor = await this._mentorRepo.getProfileWithImage(mentorId);
      return mentor;
    } catch (error: unknown) {

      logger.error(`Error in getMentorProfile service: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}
