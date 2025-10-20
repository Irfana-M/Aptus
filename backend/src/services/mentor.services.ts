import type {
  IMentorAuthRepository,
  IMentorRepository,
} from "../interfaces/repositories/IMentorRepository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import type { IEmailService } from "../interfaces/services/IEmailService.js";
import type { MentorProfile } from "../interfaces/models/mentor.interface.js";
import type { IMentorService } from "../interfaces/services/IMentorService.js";
import { MentorModel } from "../models/mentor.model.js";
import { logger } from "../utils/logger.js";

export class MentorService implements IMentorService {
  constructor(
    private _mentorAuthRepo: IMentorAuthRepository,
    private _mentorRepo: IMentorRepository,
    private _emailService: IEmailService
  ) {}


  async registerMentor(data: AuthUser): Promise<AuthUser> {
    try {
      logger.info(`Registering new mentor with email: ${data.email}`);
      
      const existingMentor = await this._mentorAuthRepo.findByEmail(data.email);
      if (existingMentor) {
        logger.warn(`Mentor registration failed - Email already exists: ${data.email}`);
        throw new Error('Mentor with this email already exists');
      }

      const mentor = await this._mentorAuthRepo.createUser(data);
      logger.info(`Mentor registered successfully: ${mentor.email}`);
      
      return mentor;
    } catch (error: any) {
      logger.error(`Error in registerMentor for email ${data.email}: ${error.message}`, { error: error.stack });
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

      // Process the form data
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

      // Handle array fields if they're sent as JSON strings
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

      // Handle file upload for profile picture
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

  async approveMentor(mentorId: string, adminId: string): Promise<{ message: string }> {
    try {
      logger.info(`Approving mentor - Mentor: ${mentorId}, Admin: ${adminId}`);

      const updatedMentor = await this._mentorRepo.updateApprovalStatus(mentorId, "approved");
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
        logger.info(`Approval email sent successfully to: ${updatedMentor.email}`);
      } catch (emailError: any) {
        logger.warn(`Failed to send approval email to ${updatedMentor.email}: ${emailError.message}`);
        // Don't throw error, just log warning
      }

      logger.info(`Mentor approved successfully: ${mentorId}`);
      return { message: "Mentor approved and notification sent" };
    } catch (error: any) {
      logger.error(`Error in approveMentor for mentor ${mentorId}: ${error.message}`, { error: error.stack });
      throw error;
    }
  }
  
  async rejectMentor(mentorId: string, reason: string, adminId: string): Promise<{ message: string }> {
    try {
      logger.info(`Rejecting mentor - Mentor: ${mentorId}, Admin: ${adminId}, Reason: ${reason}`);

      const updatedMentor = await this._mentorRepo.updateApprovalStatus(mentorId, "rejected", reason);
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
        logger.info(`Rejection email sent successfully to: ${updatedMentor.email}`);
      } catch (emailError: any) {
        logger.warn(`Failed to send rejection email to ${updatedMentor.email}: ${emailError.message}`);
        // Don't throw error, just log warning
      }

      logger.info(`Mentor rejected successfully: ${mentorId}`);
      return { message: "Mentor rejected and notification sent" };
    } catch (error: any) {
      logger.error(`Error in rejectMentor for mentor ${mentorId}: ${error.message}`, { error: error.stack });
      throw error;
    }
  }


  private async handleProfilePictureUpload(file: any): Promise<string> {
    try {
      logger.debug(`Handling profile picture upload: ${file.originalname}`);
      
      // Implement your file upload logic here
      // This could be to AWS S3, Cloudinary, or your local storage
      // For now, return a placeholder or the filename
      const fileUrl = `uploads/${Date.now()}-${file.originalname}`;
      
      logger.debug(`Profile picture upload completed: ${fileUrl}`);
      return fileUrl;
    } catch (error: any) {
      logger.error(`Error in handleProfilePictureUpload: ${error.message}`, { error: error.stack });
      throw new Error(`Failed to upload profile picture: ${error.message}`);
    }
  }
}
