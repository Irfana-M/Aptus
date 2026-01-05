import { MentorModel } from "../models/mentor/mentor.model";
import type { IMentorRepository, MentorPaginatedResult } from "../interfaces/repositories/IMentorRepository";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import { BaseRepository } from "./baseRepository";
import { Model, type Document, type PipelineStage } from "mongoose";
import type { FilterQuery } from "mongoose";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { getSignedFileUrl } from "../utils/s3Upload";
import { injectable } from "inversify";
import { AppError } from "../utils/AppError";
import { Subject } from "../models/subject.model";
import type { MentorPaginationParams } from "../dto/shared/paginationTypes";

@injectable()
export class MentorRepository
  extends BaseRepository<MentorProfile & Document>
  implements IMentorRepository
{
  constructor() {
    super(MentorModel as unknown as Model<MentorProfile & Document>);
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
    } catch (error: unknown) {
      logger.error(`Error finding mentor by email - ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in getProfileWithImage: ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error fetching all mentors - ${errorMessage}`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        `Error submitting mentor for approval: ${id} - ${errorMessage}`
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error fetching pending approvals - ${errorMessage}`);
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
      const update: Record<string, unknown> = { approvalStatus: status };
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        `Error updating approval status for mentor: ${id} - ${errorMessage}`
      );
      throw new AppError(
        "Failed to update approval status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

// In your MentorRepository - fix the query
  async findBySubjectProficiency(subjectName: string): Promise<MentorProfile[]> {
    try {
      logger.debug(`Repository: Searching for mentors with subject: ${subjectName}`);
      
      const query: FilterQuery<MentorProfile> = {
        approvalStatus: "approved",
        isBlocked: { $ne: true },
        subjectProficiency: {
          $elemMatch: {
            subject: {
              $regex: subjectName.trim(),
              $options: 'i' // case-insensitive
            }
          }
        }
      };

      const mentors = await this.model
        .find(query)
        .select('-password')
        .lean()
        .exec();

      logger.info(`Repository found: ${mentors.length} mentors`);
      
      return mentors;
    } catch (error) {
      logger.error(`MentorRepository: Error finding mentors by subject ${subjectName}`, error);
      throw error;
    }
  }


  async findAvailableMentors(params: {
    gradeId: string;
    subjectId: string;
    days?: string[];
    timeSlot?: string;
    excludeCourseId?: string;
  }) {

    const { subjectId, days, timeSlot, excludeCourseId } = params;
    
    try {
      logger.info(`findAvailableMentors called with: subjectId=${subjectId}, days=${days}, timeSlot=${timeSlot}`);
      
      let subjectName = "";

      // Check if subjectId is a valid ObjectId
      // Handle potential undefined subjectId
      if (!subjectId) {
         throw new AppError("Subject ID is required", HttpStatusCode.BAD_REQUEST);
      }

      const isValidId = /^[0-9a-fA-F]{24}$/.test(subjectId);

      if (isValidId) {
        const subject = await Subject.findById(subjectId);
        if (!subject) throw new AppError("Subject not found", HttpStatusCode.NOT_FOUND);
        subjectName = subject.subjectName;
      } else {
        // Assume it is the name
        subjectName = subjectId;
      }

      // 1. Base Match: Active, Verified, Approved, Subject Match
      const matchStage: FilterQuery<MentorProfile> = {
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

      logger.info(`🔍 findAvailableMentorsDB query: ${JSON.stringify(matchStage)}`);

      // 2. Lookup conflicting courses (if time provided)
      // We do NOT filter by time availability in the initial match anymore
      // We fetch ALL mentors for the subject, then check their specific availability in the result.
      
      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $project: {
            fullName: 1,
            profilePicture: 1,
            rating: 1,
            bio: 1,
            availability: 1,
            subjectProficiency: 1,
          },
        }
      ];

      if (days && days.length > 0 && timeSlot) {
          // We still want to know if they represent a "Perfect Match"
          // But we return everyone. The Service will filter based on the availability and conflicts.
          // Actually, to make it efficient, we can check conflicts here but keep them in the result?
          // Let's just return the availability and let the Service or Controller classify them.
          
          // However, we MUST check for "Conflicting Bookings" to know if they are available at the requested time.
          // We can add a field "hasConflict" if they are booked at that time.
          pipeline.push({
              $lookup: {
                  from: "courses",
                  let: { mentorId: "$_id" },
                  pipeline: [
                      {
                          $match: {
                              $expr: {
                                  $and: [
                                      { $eq: ["$mentor", "$$mentorId"] },
                                      { $in: ["$status", ["booked", "ongoing"]] },
                                      { $eq: ["$isActive", true] },
                                      { $eq: ["$schedule.timeSlot", timeSlot] },
                                      { $gt: [ { $size: { $setIntersection: ["$schedule.days", days] } }, 0 ] },
                                      ...(excludeCourseId ? [{ $ne: ["$_id", { $toObjectId: excludeCourseId }] }] : [])
                                  ]
                              }
                          }
                      }
                  ],
                  as: "conflictingBookings"
              }
          });
      }

      const mentors = await MentorModel.aggregate(pipeline);
      
      // Sign URLs for profile pictures
      const mentorsWithImages = await Promise.all(mentors.map(async (mentor) => {
          const mentorObj = { ...mentor };
          if (mentor.profilePicture) {
              try {
                  if (mentor.profilePicture.startsWith('http')) {
                      mentorObj.profileImageUrl = mentor.profilePicture;
                  } else {
                      mentorObj.profileImageUrl = await getSignedFileUrl(mentor.profilePicture);
                  }
              } catch (error) {
                  logger.error(`Error signing URL for findAvailableMentors result ${mentor._id}:`, error);
                  mentorObj.profileImageUrl = null;
              }
          } else {
              mentorObj.profileImageUrl = null;
          }
          return mentorObj;
      }));

      logger.info(`🔍 findAvailableMentors found ${mentorsWithImages.length} subject potential matches`);
      return mentorsWithImages;

    } catch (error: any) {
      logger.error(`CRITICAL: Error in findAvailableMentors: ${error.message}`, { stack: error.stack });
      throw new AppError(
        `Failed to find available mentors: ${error.message}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
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
      const query: FilterQuery<MentorProfile> = {};

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
        mentors.map(async (mentor :MentorProfile) => {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Error in findAllMentorsPaginated: ${errorMessage}`);
      throw new AppError(
        'Failed to fetch paginated mentors',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
