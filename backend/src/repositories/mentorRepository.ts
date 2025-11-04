import { MentorModel } from "../models/mentor.model";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "@/config/s3Config";
import { injectable } from "inversify";

@injectable()
export class MentorRepository implements IMentorRepository {
  async create(data: Partial<MentorProfile>): Promise<MentorProfile> {
    try {
      const mentor = new MentorModel(data);
      const savedMentor = await mentor.save();
      logger.info(`Mentor created: ${savedMentor._id}`);
      return savedMentor.toObject();
    } catch (error: any) {
      logger.error(`Error creating mentor: ${error.message}`);
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async updateById(
    id: string,
    data: Partial<MentorProfile>
  ): Promise<MentorProfile> {
    try {
      const updatedMentor = await MentorModel.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
      })
        .lean()
        .exec();

      if (!updatedMentor) {
        logger.warn(`Mentor update failed, ID not found: ${id}`);
        throw {
          statusCode: HttpStatusCode.NOT_FOUND,
          message: `Mentor with ID ${id} not found`,
        };
      }
      logger.info(`Mentor updated: ${id}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(`Error updating mentor: ${id} - ${error.message}`);
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      const result = await MentorModel.findByIdAndDelete(id).exec();
      const deleted = !!result;

      if (deleted) {
        logger.info(`Mentor deleted: ${id}`);
      } else {
        logger.warn(`Mentor delete failed, ID not found: ${id}`);
      }

      return deleted;
    } catch (error: any) {
      logger.error(`Error deleting mentor: ${id} - ${error.message}`);
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async findById(id: string): Promise<MentorProfile | null> {
    try {
      const mentor = await MentorModel.findById(id).lean().exec();
      if (!mentor) {
        logger.warn(`Mentor not found by ID: ${id}`);
        return null;
      }
      logger.info(`Mentor found by ID: ${id}`);
      return mentor;
    } catch (error: any) {
      logger.error(`Error finding mentor by ID: ${id} - ${error.message}`);
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getAllMentors(): Promise<MentorProfile[]> {
    try {
      const mentors = await MentorModel.find()
        .sort({ createdAt: -1 })
        .lean()
        .exec();

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
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async updateProfile(
    id: string,
    data: Partial<MentorProfile>
  ): Promise<MentorProfile | null> {
    try {
      const updatedMentor = await MentorModel.findByIdAndUpdate(id, data, {
        new: true,
      })
        .lean()
        .exec();
      if (!updatedMentor) {
        logger.warn(`Mentor profile update failed, ID not found: ${id}`);
        return null;
      }
      logger.info(`Mentor profile updated: ${id}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(`Error updating mentor profile: ${id} - ${error.message}`);
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async submitForApproval(id: string): Promise<MentorProfile> {
    try {
      const updatedMentor = await MentorModel.findByIdAndUpdate(
        id,
        { approvalStatus: "pending", submittedForApprovalAt: new Date() },
        { new: true }
      )
        .lean()
        .exec();
      if (!updatedMentor) {
        logger.warn(`Mentor submit for approval failed, ID not found: ${id}`);
        throw {
          statusCode: HttpStatusCode.NOT_FOUND,
          message: `Mentor with ID ${id} not found`,
        };
      }
      logger.info(`Mentor submitted for approval: ${id}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(
        `Error submitting mentor for approval: ${id} - ${error.message}`
      );
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }

  async getPendingApprovals(): Promise<MentorProfile[]> {
    try {
      const mentors = await MentorModel.find({ approvalStatus: "pending" })
        .lean()
        .exec();
      logger.info(`Fetched pending mentor approvals, count=${mentors.length}`);
      return mentors;
    } catch (error: any) {
      logger.error(`Error fetching pending approvals - ${error.message}`);
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
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

      const updatedMentor = await MentorModel.findByIdAndUpdate(id, update, {
        new: true,
      })
        .lean()
        .exec();
      if (!updatedMentor) {
        logger.warn(
          `Mentor approval status update failed, ID not found: ${id}`
        );
        throw {
          statusCode: HttpStatusCode.NOT_FOUND,
          message: `Mentor with ID ${id} not found`,
        };
      }

      logger.info(`Mentor approval status updated: ${id}, status=${status}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(
        `Error updating approval status for mentor: ${id} - ${error.message}`
      );
      throw {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
        message: error.message,
      };
    }
  }
}
