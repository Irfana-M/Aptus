import { injectable, inject } from 'inversify';
import type {
  IMentorRepository,
} from "../interfaces/repositories/IMentorRepository";
import type { IMentorAuthRepository } from '@/interfaces/repositories/IMentorAuthRepository';
import type { AuthUser } from "../interfaces/auth/auth.interface";
import type { IEmailService } from "../interfaces/services/IEmailService";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import type { IMentorService } from "../interfaces/services/IMentorService";
import { logger } from "../utils/logger";
import { uploadFileToS3 } from "../utils/s3Upload";
import { TYPES } from '../types';
import type { RegisterUserDto } from '@/dto/auth/RegisteruserDTO';

@injectable()
export class MentorService implements IMentorService {
  constructor(
    @inject(TYPES.IMentorAuthRepository) private _mentorAuthRepo: IMentorAuthRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.EmailService) private _emailService: IEmailService
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
    } catch (error: any) {
      logger.error(
        `Error in registerMentor for email ${data.email}: ${error.message}`,
        { error: error.stack }
      );
      throw error;
    }
  }

  async updateMentorProfile(
    mentorId: string,
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

      if (data.profilePicture) {
        try {
          updateData.profilePicture = await this.handleProfilePictureUpload(
            data.profilePicture
          );
          logger.debug(`Processed profile picture for mentor: ${mentorId}`);
        } catch (uploadError: any) {
          logger.error(
            `Error uploading profile picture for mentor ${mentorId}: ${uploadError.message}`
          );
          throw new Error(
            `Failed to upload profile picture: ${uploadError.message}`
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
    } catch (error: any) {
      logger.error(
        `Error in updateMentorProfile for mentor ${mentorId}: ${error.message}`,
        { error: error.stack }
      );
      throw new Error(`Failed to update mentor profile: ${error.message}`);
    }
  }

  async submitProfileForApproval(
    mentorId: string,
    requestingUserId: string
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
          "Mentora - Your Mentor Profile is Approved",
          `<p>Hi ${updatedMentor.fullName},</p>
          <p>Congratulations — your mentor profile has been approved by our admin team.</p>
          <p>You can now access all mentor features and start helping students.</p>
          <br>
          <p>Best regards,<br>The Mentora Team</p>`
        );
        logger.info(
          `Approval email sent successfully to: ${updatedMentor.email}`
        );
      } catch (emailError: any) {
        logger.warn(
          `Failed to send approval email to ${updatedMentor.email}: ${emailError.message}`
        );
      }

      logger.info(`Mentor approved successfully: ${mentorId}`);
      return { message: "Mentor approved and notification sent" };
    } catch (error: any) {
      logger.error(
        `Error in approveMentor for mentor ${mentorId}: ${error.message}`,
        { error: error.stack }
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
          "Mentora - Mentor Profile Review Update",
          `<p>Hi ${updatedMentor.fullName},</p>
          <p>Thank you for submitting your mentor profile for review.</p>
          <p>After careful consideration, we are unable to approve your profile at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please review your profile, make the necessary updates, and resubmit for approval.</p>
          <br>
          <p>Best regards,<br>The Mentora Team</p>`
        );
        logger.info(
          `Rejection email sent successfully to: ${updatedMentor.email}`
        );
      } catch (emailError: any) {
        logger.warn(
          `Failed to send rejection email to ${updatedMentor.email}: ${emailError.message}`
        );
      }

      logger.info(`Mentor rejected successfully: ${mentorId}`);
      return { message: "Mentor rejected and notification sent" };
    } catch (error: any) {
      logger.error(
        `Error in rejectMentor for mentor ${mentorId}: ${error.message}`,
        { error: error.stack }
      );
      throw error;
    }
  }

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
    } catch (error: any) {
      logger.error(`Error uploading profile picture: ${error.message}`);
      throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
  }
}
