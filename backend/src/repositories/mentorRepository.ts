import { MentorModel } from "../models/mentor/mentor.model";
import type { IMentorRepository, MentorPaginatedResult } from "../interfaces/repositories/IMentorRepository";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import { BaseRepository } from "./baseRepository";
import { Model, type Document, type PipelineStage, type ClientSession } from "mongoose";
import type { FilterQuery } from "mongoose";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { getSignedFileUrl } from "../utils/s3Upload";
import { injectable } from "inversify";
import { AppError } from "../utils/AppError";
import { Subject } from "../models/subject.model";
import { normalizeTimeTo24h } from "../utils/time.util";
import type { MentorPaginationParams } from "@/dtos/shared/paginationTypes";
import { getPaginationParams } from "@/utils/pagination.util";

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
    data: Partial<MentorProfile>,
    session?: ClientSession
  ): Promise<MentorProfile | null> {
    return await this.updateById(id, data, session);
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

  async findBySubjectProficiency(subjectName: string): Promise<MentorProfile[]> {
    try {
      logger.info(`MentorRepository: findBySubjectProficiency called with "${subjectName}"`);
      
      const pipeline: PipelineStage[] = [
        {
          $match: {
            approvalStatus: "approved",
            isBlocked: { $ne: true },
            subjectProficiency: {
              $elemMatch: {
                $or: [
                  { 
                    subject: {
                      $regex: subjectName.trim(),
                      $options: 'i' // case-insensitive regex for Name matching
                    }
                  },
                  { 
                    subject: subjectName.trim() // exact match for ID strings or exact names
                  }
                ]
              }
            }
          }
        },
        {
          $lookup: {
            from: "mentoravailabilities",
            localField: "_id",
            foreignField: "mentorId",
            as: "externalAvailability"
          }
        },
        {
          $addFields: {
            availability: {
              $concatArrays: [
                { $ifNull: ["$availability", []] },
                {
                  $map: {
                    input: { 
                      $filter: {
                        input: { $ifNull: ["$externalAvailability", []] },
                        as: "ext",
                        cond: { $eq: ["$$ext.isActive", true] }
                      }
                    },
                    as: "avail",
                    in: {
                      day: "$$avail.dayOfWeek",
                      slots: "$$avail.slots"
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $project: {
            password: 0,
            externalAvailability: 0
          }
        }
      ];

      const mentors = await this.model.aggregate(pipeline).exec();
      logger.info(`MentorRepository: findBySubjectProficiency returned ${mentors.length} mentors`);
      
      return mentors;
    } catch (error) {
      logger.error(`MentorRepository: Error in findBySubjectProficiency for "${subjectName}"`, error);
      throw error;
    }
  }


  async findAvailableMentors(params: {
    gradeId: string;
    subjectId: string;
    days?: string[];
    timeSlot?: string;
    excludeCourseId?: string;
  }): Promise<unknown[]> { // Changed return type to unknown[] to match the instruction's context
    const { subjectId, days, timeSlot, excludeCourseId } = params;
    
    try {
      logger.info(`🔍 findAvailableMentors called with: subjectId=${subjectId}, days=${days}, timeSlot=${timeSlot}`);
      
      let subjectName = "";

      // Handle potential undefined subjectId
      if (!subjectId) {
         logger.error('❌ Subject ID is required but was not provided');
         throw new AppError("Subject ID is required", HttpStatusCode.BAD_REQUEST);
      }

      // Check if subjectId is a valid ObjectId
      const isValidId = /^[0-9a-fA-F]{24}$/.test(subjectId);

      if (isValidId) {
        logger.debug(`✓ subjectId is valid ObjectId, looking up subject document`);
        const subject = await Subject.findById(subjectId);
        if (!subject) {
          logger.error(`❌ Subject not found with ID: ${subjectId}`);
          throw new AppError("Subject not found", HttpStatusCode.NOT_FOUND);
        }
        subjectName = subject.subjectName;
        logger.info(`✓ Resolved subject ID to name: ${subjectName}`);
      } else {
        // Assume it is the name
        logger.warn(`⚠️ subjectId is not a valid ObjectId, treating as subject name: ${subjectId}`);
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

      const pipeline: PipelineStage[] = [
        { $match: matchStage },
        {
          $project: {
            fullName: 1,
            profilePicture: 1,
            rating: 1,
            totalRatings: 1,
            bio: 1,
            availability: 1,
            subjectProficiency: 1,
            academicQualifications: 1,
            experiences: 1,
            maxSessionsPerWeek: 1,
            maxSessionsPerDay: 1,
            currentWeeklyBookings: 1
          },
        },
        // Stage 1: Global Weekly Capacity Check
        {
          $match: {
            $expr: {
              $lt: [
                {
                  $cond: {
                    if: { $and: [
                      { $ne: [{ $ifNull: [excludeCourseId, ""] }, ""] },
                      { $toObjectId: { $ifNull: [excludeCourseId, "000000000000000000000000"] } } // dummy to avoid crash if null
                    ] },
                    then: { $subtract: ["$currentWeeklyBookings", 1] },
                    else: "$currentWeeklyBookings"
                  }
                },
                "$maxSessionsPerWeek"
              ]
            }
          }
        }
      ];

      // Add availability and daily capacity check
      if (days && days.length > 0 && timeSlot) {
          // Calculate requested day capacity
          // We check courses for the EXACT days requested
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
                                      // Intersection of requested days and course days
                                      { $gt: [ { $size: { $setIntersection: ["$schedule.days", days] } }, 0 ] }
                                  ]
                              }
                          }
                      },
                      // Group by day to find max load on any single day in the requested set
                      { $unwind: "$schedule.days" },
                      { $match: { $expr: { $in: ["$schedule.days", days] } } },
                      { $group: { _id: "$schedule.days", count: { $sum: 1 } } }
                  ],
                  as: "dailyLoads"
              }
          });

          // Filter: Ensure no requested day exceeds maxSessionsPerDay
          pipeline.push({
              $match: {
                  $expr: {
                      $allElementsTrue: {
                          $map: {
                              input: days,
                              as: "d",
                              in: {
                                  $lt: [
                                      {
                                          $let: {
                                              vars: { 
                                                  dayLoad: { 
                                                      $arrayElemAt: [
                                                          { $filter: { input: "$dailyLoads", as: "dl", cond: { $eq: ["$$dl._id", "$$d"] } } },
                                                          0
                                                      ]
                                                  }
                                              },
                                              in: { $ifNull: ["$$dayLoad.count", 0] }
                                          }
                                      },
                                      "$maxSessionsPerDay"
                                  ]
                              }
                          }
                      }
                  }
              }
          });

          // Existing logic for specific slot availability and conflicts...
          // 1. Lookup MentorAvailability for matching days
          pipeline.push({
              $lookup: {
                  from: "mentoravailabilities",
                  let: { mentorId: "$_id" },
                  pipeline: [
                      {
                          $match: {
                              $expr: {
                                  $and: [
                                      { $eq: ["$mentorId", "$$mentorId"] },
                                      { $in: ["$dayOfWeek", days] },
                                      { $eq: ["$isActive", true] }
                                  ]
                              }
                          }
                      }
                  ],
                  as: "availabilityRecords"
              }
          });

          const isBatchTime = ['MORNING', 'AFTERNOON'].includes(timeSlot);
          let startTime = '';
          
          if (!isBatchTime && timeSlot) {
              const [start] = timeSlot.split('-').map(s => s.trim());
              startTime = normalizeTimeTo24h(start || '');
              logger.debug(`✓ Normalized specific time slot: ${start} -> ${startTime}`);
          } else {
              logger.debug(`✓ Checking for ${timeSlot} batch availability on days: ${days.join(', ')}`);
          }
          
          pipeline.push({
              $addFields: {
                  hasMatchingAvailability: {
                      $reduce: {
                          input: { 
                              $concatArrays: [
                                  { $ifNull: ["$availabilityRecords", []] },
                                  { $filter: {
                                      input: { $ifNull: ["$availability", []] },
                                      as: "a",
                                      cond: { $in: ["$$a.day", days] }
                                  }}
                              ]
                          },
                          initialValue: false,
                          in: {
                              $or: [
                                  "$$value",
                                  {
                                      $anyElementTrue: {
                                          $map: {
                                              input: "$$this.slots",
                                              as: "slot",
                                              in: isBatchTime 
                                                  ? true 
                                                  : { $eq: ["$$slot.startTime", startTime] }
                                          }
                                      }
                                  }
                              ]
                          }
                      }
                  }
              }
          });

          // 3. Check for conflicting bookings
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

          // 4. Filter: Keep only mentors with availability AND no conflicts
          pipeline.push({
              $match: {
                  hasMatchingAvailability: true,
                  conflictingBookings: { $size: 0 }
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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error(`CRITICAL: Error in findAvailableMentors: ${errorMessage}`, { stack: errorStack });
      throw new AppError(
        `Failed to find available mentors: ${errorMessage}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAllMentorsPaginated(params: MentorPaginationParams): Promise<MentorPaginatedResult> {
    try {
      const { page, limit } = getPaginationParams(params as any);
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

      // Execute query with pagination using base method
      const { items: mentors, total } = await this.findPaginated(
        query as Record<string, unknown>,
        page,
        limit
      );

      const mentorsWithImages = await Promise.all(
        mentors.map(async (mentorDoc) => {
          const mentor = mentorDoc as unknown as MentorProfile;
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

  async incrementWeeklyBookings(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { $inc: { currentWeeklyBookings: 1 } });
  }

  async decrementWeeklyBookings(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { $inc: { currentWeeklyBookings: -1 } });
  }

  async addLeave(id: string, leave: { startDate: Date; endDate: Date; reason?: string; approved: boolean }): Promise<void> {
    await this.model.findByIdAndUpdate(id, {
      $push: { leaves: leave }
    });
  }

  async updateLeaveStatus(mentorId: string, leaveId: string, approved: boolean): Promise<void> {
    await this.model.updateOne(
      { _id: mentorId, "leaves._id": leaveId },
      { $set: { "leaves.$.approved": approved } }
    );
  }
}
