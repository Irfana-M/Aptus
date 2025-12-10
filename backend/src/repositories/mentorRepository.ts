import { MentorModel } from "../models/mentor/mentor.model";
import type { IMentorRepository, MentorPaginatedResult } from "../interfaces/repositories/IMentorRepository";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import { BaseRepository } from "./baseRepository";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { getSignedFileUrl } from "../utils/s3Upload";
import { injectable } from "inversify";
import { AppError } from "@/utils/AppError";
import { Subject } from "@/models/subject.model";
import type { MentorPaginationParams } from "@/dto/shared/paginationTypes";

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

  async getProfileWithImage(id: string): Promise<MentorProfile | null> {
    try {
      const mentor = await this.model.findById(id).lean().exec();
      if (!mentor) return null;

      const mentorObj = { ...mentor } as MentorProfile;

      if (mentor.profilePicture) {
        try {
          // If it's already a full URL (e.g. dicebear or external), leave it
          if (mentor.profilePicture.startsWith("http")) {
            mentorObj.profileImageUrl = mentor.profilePicture;
          } else {
            const imageUrl = await getSignedFileUrl(mentor.profilePicture);
            mentorObj.profileImageUrl = imageUrl;
          }
        } catch (error) {
          logger.error(`Error signing URL for mentor ${id}:`, error);
          mentorObj.profileImageUrl = null;
        }
      }

      return mentorObj;
    } catch (error: any) {
      logger.error(`Error in getProfileWithImage: ${error.message}`);
      throw error;
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
              const imageUrl = await getSignedFileUrl(mentor.profilePicture);
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
      isVerified: true,
      "subjectProficiency.subject": {
        $regex: subjectName.trim(),
        $options: 'i' // case-insensitive
      }
    };

    console.log('🔍 Repository query:', JSON.stringify(query, null, 2));

    const mentors = await this.model
      .find(query)
      .select('-password')
      .lean()
      .exec();

    console.log('🔍 Repository found:', mentors.length, 'mentors');
    console.log('Found mentor IDs:', mentors.map((m: { _id: any; fullName: any; }) => ({ id: m._id, name: m.fullName })));
    
    return mentors;
  } catch (error) {
    console.error('❌ Repository error:', error);
    logger.error(`MentorRepository: Error finding mentors by subject ${subjectName}`, error);
    throw error;
  }
}

async findAvailableMentors(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
  }) {

   const { gradeId, subjectId, dayOfWeek, timeSlot } = params;    
   const subject = await Subject.findById(subjectId);
   if(!subject) throw new AppError("Subject not found", HttpStatusCode.NOT_FOUND);

   const subjectName = subject.subjectName;

   const matchStage: any = {
    isActive: { $ne: false },
    isVerified: true,
    approvalStatus: "approved",
    isBlocked: false,
    subjectProficiency: {
      $elemMatch: {
        subject: { $regex: new RegExp(`^${subjectName}$`, "i") },
        level: { $in: ["intermediate", "expert"] }
      }
    }
   };

   logger.info(`🔍 findAvailableMentors query for '${subjectName}': ${JSON.stringify(matchStage)}`);

   if (dayOfWeek !== undefined && timeSlot) {
      matchStage["availability"] = {
        $elemMatch: { 
          dayOfWeek,
          timeSlots: timeSlot,
        },
      };
    }

    const result = await MentorModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "courses",
          let: { mentorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$mentor", "$$mentorId"] },
                    { $eq: ["$status", "booked"] },
                    { $eq: ["$dayOfWeek", dayOfWeek] },
                    { $eq: ["$timeSlot", timeSlot] },
                  ],
                },
              },
            },
          ],
          as: "conflictingBookings",
        },
      },
      { $match: { conflictingBookings: { $size: 0 } } }, // no conflict
      {
        $project: {
          fullName: 1,
          profilePicture: 1,
          rating: 1,
          bio: 1,
          availability: 1,
          subjectProficiency: 1,
        },
      },
    ]);
    
    logger.info(`🔍 findAvailableMentors found ${result.length} matches`);
    return result;
  }

  async findAllMentorsPaginated(params: MentorPaginationParams): Promise<MentorPaginatedResult> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;
      const search = params.search?.trim() || '';
      const status = params.status || '';
      const subject = params.subject || '';

      // Build the query filter
      const query: any = {};

      // Search filter (fullName or email)
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Status filter (approvalStatus)
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        query.approvalStatus = status;
      }

      // Subject filter
      if (subject) {
        query['subjectProficiency.subject'] = { $regex: subject, $options: 'i' };
      }

      logger.info(`findAllMentorsPaginated: Query=${JSON.stringify(query)}, page=${page}, limit=${limit}`);

      // Execute query with pagination
      const [mentors, total] = await Promise.all([
        this.model
          .find(query)
          .select('-password')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.model.countDocuments(query)
      ]);


      const mentorsWithImages = await Promise.all(
        mentors.map(async (mentor: MentorProfile) => {
          const mentorObj = { ...mentor } as MentorProfile;

          if (mentor.profilePicture) {
            try {
              if (mentor.profilePicture.startsWith('http')) {
                mentorObj.profileImageUrl = mentor.profilePicture;
              } else {
                const imageUrl = await getSignedFileUrl(mentor.profilePicture);
                mentorObj.profileImageUrl = imageUrl;
              }
            } catch (error) {
              logger.error(`Error generating signed URL for mentor: ${mentor._id}`, error);
              mentorObj.profileImageUrl = null;
            }
          } else {
            mentorObj.profileImageUrl = null;
          }

          return mentorObj;
        })
      );

      logger.info(`findAllMentorsPaginated: Found ${mentorsWithImages.length} mentors, total=${total}`);

      return {
        mentors: mentorsWithImages,
        total
      };
    } catch (error: any) {
      logger.error(`Error in findAllMentorsPaginated: ${error.message}`);
      throw new AppError(
        'Failed to fetch paginated mentors',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
