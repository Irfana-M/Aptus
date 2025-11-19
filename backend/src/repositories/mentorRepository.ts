import { MentorModel } from "../models/mentor/mentor.model";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import { BaseRepository } from "./baseRepository";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "@/config/s3Config";
import { injectable } from "inversify";
import { AppError } from "@/utils/AppError";

@injectable()
export class MentorRepository
  extends BaseRepository<MentorProfile>
  implements IMentorRepository
{
  constructor() {
    super(MentorModel);
  }

  async findByEmail(email: string): Promise<MentorProfile | null> {
    try {
      logger.debug(`Finding mentor by email: ${email}`);
      const mentor = await this.model
        .findOne({ email })
        .select("+password")
        .lean()
        .exec();

      if (!mentor) {
        logger.debug(`Mentor not found with email: ${email}`);
        return null;
      }

      logger.info(`Mentor found with email: ${email}`);
      return mentor as MentorProfile;
    } catch (error: any) {
      logger.error(`Error finding mentor by email - ${error.message}`);
      throw new AppError(
        "Failed to find mentor by email",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllMentors(): Promise<MentorProfile[]> {
    try {
      const mentors = await this.findAll();

      const mentorsWithImages = await Promise.all(
        mentors.map(async (mentor) => {
          const mentorObj = { ...mentor };

          if (mentor.profilePicture) {
            try {
              const command = new GetObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME!,
                Key: mentor.profilePicture,
              });

              const imageUrl = await getSignedUrl(s3Client, command, {
                expiresIn: 3600,
              });
              mentorObj.profileImageUrl = imageUrl;
            } catch (error) {
              console.error(
                "Error generating signed URL for mentor:",
                mentor._id,
                error
              );
              mentorObj.profileImageUrl = null;
            }
          } else {
            mentorObj.profileImageUrl = null;
          }

          return mentorObj;
        })
      );

      logger.info(
        `Fetched all mentors with images, count=${mentorsWithImages.length}`
      );
      return mentorsWithImages;
    } catch (error: any) {
      logger.error(`Error fetching all mentors - ${error.message}`);
      throw new AppError(
        "Failed to fetch mentors",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateProfile(
    id: string,
    data: Partial<MentorProfile>
  ): Promise<MentorProfile | null> {
    return await this.updateById(id, data);
  }

  async submitForApproval(id: string): Promise<MentorProfile> {
    try {
      const updatedMentor = await this.model
        .findByIdAndUpdate(
          id,
          { approvalStatus: "pending", submittedForApprovalAt: new Date() },
          { new: true }
        )
        .lean()
        .exec();
      if (!updatedMentor) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }
      logger.info(`Mentor submitted for approval: ${id}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(
        `Error submitting mentor for approval: ${id} - ${error.message}`
      );
      throw new AppError(
        "Failed to submit mentor for approval",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPendingApprovals(): Promise<MentorProfile[]> {
    try {
      const mentors = await this.model
        .find({ approvalStatus: "pending" })
        .lean()
        .exec();
      logger.info(`Fetched pending mentor approvals, count=${mentors.length}`);
      return mentors;
    } catch (error: any) {
      logger.error(`Error fetching pending approvals - ${error.message}`);
      throw new AppError(
        "Failed to fetch pending approvals",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateApprovalStatus(
    id: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<MentorProfile | null> {
    try {
      const update: any = { approvalStatus: status };
      if (status === "rejected") update.rejectionReason = rejectionReason || "";
      if (status === "approved") update.rejectionReason = undefined;

      const updatedMentor = await this.model
        .findByIdAndUpdate(id, update, {
          new: true,
        })
        .lean()
        .exec();
      if (!updatedMentor) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }

      logger.info(`Mentor approval status updated: ${id}, status=${status}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(
        `Error updating approval status for mentor: ${id} - ${error.message}`
      );
      throw new AppError(
        "Failed to update approval status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

// In your MentorRepository - fix the query
async findBySubjectProficiency(subjectName: string, date?: string): Promise<MentorProfile[]> {
  try {
    console.log('🔍 Repository: Searching for mentors with subject:', subjectName);
    
    const query: any = {
      approvalStatus: "approved",
      isBlocked: false,
      isActive: true,
      "subjectProficiency.subject": { 
        $regex: new RegExp(`^${subjectName}$`, 'i') // Exact match, case insensitive
      }
    };

    console.log('🔍 Repository query:', JSON.stringify(query, null, 2));

    // If date is provided, filter by availability
    if (date) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      query["availability.dayOfWeek"] = dayOfWeek;
      console.log('🔍 Adding day filter:', dayOfWeek);
    }

    const mentors = await this.model
      .find(query)
      .select('-password')
      .exec();

    console.log('🔍 Repository found:', mentors.length, 'mentors');
    
    return mentors;
  } catch (error) {
    console.error('❌ Repository error:', error);
    logger.error(`MentorRepository: Error finding mentors by subject ${subjectName}`, error);
    throw error;
  }
}
  
}
