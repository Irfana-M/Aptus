import type { IStudentRepository, StudentPaginatedResult } from "@/interfaces/repositories/IStudentRepository.js";
import type {
  StudentAuthUser,
  AuthUser,
} from "@/interfaces/auth/auth.interface.js";
import type { StudentProfile } from "@/interfaces/models/student.interface.js";
// BaseRepository import removed
import { StudentModel } from "@/models/student/student.model.js";
import { StudentMapper } from "@/mappers/StudentMapper.js";
import { AppError } from "@/utils/AppError.js";
import { MESSAGES } from "@/constants/messages.constants.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { logger } from "@/utils/logger.js";
import { injectable } from "inversify";
import { getSignedFileUrl } from "@/utils/s3Upload.js";
import type { FilterQuery, PipelineStage } from "mongoose";
import type { StudentBaseResponseDto } from "@/dtos/auth/UserResponseDTO.js";
import { BaseRepository } from "./baseRepository.js";
import { getPaginationParams } from "@/utils/pagination.util.js";
import type { Document, ClientSession, Model } from "mongoose";
import type { StudentPaginationParams } from "@/dtos/shared/paginationTypes.js";

export interface DetailedStudentProfile extends Partial<StudentAuthUser> {
  trialClasses: unknown[];
  enrollments: unknown[];
  profileImageUrl: string | null;
}

@injectable()
export class StudentRepository
  extends BaseRepository<StudentAuthUser & Document>
  implements IStudentRepository
{
  constructor() {
    super(StudentModel as unknown as Model<StudentAuthUser & Document>);
  }

  async findByEmail(email: string): Promise<StudentAuthUser | null> {
    try {
      logger.debug(`Finding student by email: ${email}`);
      const student = await this.model
        .findOne({ email, role: "student" })
        .select("+password")
        .lean()
        .exec();

      if (!student) {
        logger.debug(`Student not found with email: ${email}`);
        return null;
      }

      if (student.profileImage) {
        try {
          if (student.profileImage.startsWith("http")) {
            student.profileImageUrl = student.profileImage;
          } else {
            student.profileImageUrl = await getSignedFileUrl(student.profileImage);
          }
        } catch (error) {
          logger.error(
            `Error generating signed URL for student: ${student._id}`,
            error
          );
        }
      }

      logger.info(`Student found with email: ${email}`);
      return StudentMapper.toStudentAuthUser({ ...student, role: "student" } as StudentAuthUser);
    } catch (error) {
      logger.error("Error finding student by email:", error);
      throw new AppError(
        MESSAGES.STUDENT.FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findById(id: string, session?: ClientSession): Promise<(StudentAuthUser & Document) | null> {
    try {
      logger.debug(`Finding student by ID: ${id}`);
      const student = await this.model.findById(id).session(session || null).lean().exec();

      if (!student) {
        logger.debug(`Student not found with ID: ${id}`);
        return null;
      }

      if (student.profileImage) {
        try {
          if (student.profileImage.startsWith("http")) {
            student.profileImageUrl = student.profileImage;
          } else {
            student.profileImageUrl = await getSignedFileUrl(student.profileImage);
          }
        } catch (error) {
          logger.error(
            `Error generating signed URL for student: ${student._id}`,
            error
          );
        }
      }

      logger.info(`Student found with ID: ${id}`);
      return StudentMapper.toStudentAuthUser({ ...student, role: "student" } as StudentAuthUser) as unknown as (StudentAuthUser & Document); 
    } catch (error) {
      logger.error("Error finding student by ID:", error);
      throw new AppError(
        MESSAGES.STUDENT.FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateProfile(
    id: string,
    data: Partial<StudentProfile>
  ): Promise<StudentProfile | null> {
    try {
      logger.debug(`Updating student profile: ${id}`);

      // NOTE: Data is already mapped by the service layer. 
      // Mapping it again here suppresses fields like 'isProfileCompleted' if they aren't in the mapper's whitelist.
      // We trust the service to have prepared the data correctly.
      
      const cleanUpdateData = this.removeUndefinedProperties(data);
      
      const result = await this.model
        .findByIdAndUpdate(id, cleanUpdateData, { new: true, runValidators: true })
        .lean()
        .exec();

      if (!result) throw new AppError(MESSAGES.STUDENT.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      return StudentMapper.toResponseDto(result as unknown as StudentAuthUser);
    } catch (error) {
      logger.error(`Error updating student profile: ${id}`, error);
      throw new AppError(
        MESSAGES.STUDENT.UPDATE_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async blockStudent(id: string): Promise<StudentAuthUser> {
    try {
      logger.debug(`Blocking student: ${id}`);

      const blockedStudent = await this.model
        .findByIdAndUpdate(
          id,
          { isBlocked: true, blockedAt: new Date() },
          { new: true }
        )
        .lean()
        .exec();

      if (!blockedStudent) throw new AppError(MESSAGES.STUDENT.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      logger.info(`Student blocked successfully: ${id}`);
      return StudentMapper.toStudentAuthUser(blockedStudent as unknown as StudentAuthUser);
    } catch (error) {
    logger.error(`Error blocking student: ${id}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      MESSAGES.STUDENT.BLOCK_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


async unblockStudent(id: string): Promise<StudentAuthUser> {
  try {
    logger.debug(`Unblocking student: ${id}`);
    
    const unblockedStudent = await this.model
      .findByIdAndUpdate(
        id,
        { isBlocked: false, blockedAt: null },
        { new: true }
      )
      .lean()
      .exec();

    if (!unblockedStudent) throw new AppError(MESSAGES.STUDENT.NOT_FOUND, HttpStatusCode.NOT_FOUND);

    logger.info(`Student unblocked successfully: ${id}`);
    
    return StudentMapper.toStudentAuthUser(unblockedStudent as unknown as StudentAuthUser);
  } catch (error) {
    logger.error(`Error unblocking student: ${id}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      MESSAGES.STUDENT.UNBLOCK_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

  async markUserVerified(email: string): Promise<void> {
    try {
      logger.debug(`Marking student as verified: ${email}`);
      const result = await this.model
        .findOneAndUpdate(
          { email, role: "student" },
          {
            $set: {
              isVerified: true,
              verifiedAt: new Date(),
            },
          },
          { new: true }
        )
        .exec();

      if (!result) {
        logger.warn(`Student not found for verification: ${email}`);
        throw new AppError(
          MESSAGES.STUDENT.NOT_FOUND,
          HttpStatusCode.NOT_FOUND
        );
      }

      logger.info(`Student marked as verified: ${email}`);
    } catch (error) {
      logger.error("Error marking student as verified:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        MESSAGES.STUDENT.VERIFY_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async create(data: Partial<StudentAuthUser>, session?: ClientSession): Promise<StudentAuthUser & Document> {
    try {
      logger.debug(`Creating new student`, { email: data.email });
      const result = await this.model.create([data], { session });
      const student = result[0];
      if (!student) throw new AppError(MESSAGES.STUDENT.CREATE_FAILED, HttpStatusCode.BAD_REQUEST);
      logger.info(`Student created successfully: ${student._id}`);
      return student as unknown as StudentAuthUser & Document;
    } catch (error) {
      logger.error(`Error creating student:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(MESSAGES.STUDENT.CREATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateById(id: string, data: Partial<StudentAuthUser>, session?: ClientSession): Promise<StudentAuthUser & Document> {
    try {
      logger.debug(`Updating student with ID: ${id}`);
      const cleanData = this.removeUndefinedProperties(data);
      const result = await this.model.findByIdAndUpdate(id, cleanData, { new: true, runValidators: true, session: session || null }).lean().exec();
      if (!result) throw new AppError(MESSAGES.STUDENT.UPDATE_FAILED, HttpStatusCode.NOT_FOUND);
      logger.info(`Student updated successfully: ${id}`);
      return result as unknown as StudentAuthUser & Document;
    } catch (error) {
      logger.error(`Error updating student with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(MESSAGES.STUDENT.UPDATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting student with ID: ${id}`);
      const result = await this.model.findByIdAndDelete(id).exec();
      if (!result) throw new AppError(MESSAGES.STUDENT.DELETE_FAILED, HttpStatusCode.NOT_FOUND);
      logger.info(`Student deleted successfully: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting student with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(MESSAGES.STUDENT.DELETE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(): Promise<(StudentAuthUser & Document)[]> {
    try {
      logger.debug(`Finding all students`);
      const results = await this.model.find({}).lean().exec();
      logger.info(`Found ${results.length} students`);
      return results as unknown as (StudentAuthUser & Document)[];
    } catch (error) {
      logger.error(`Error finding all students:`, error);
      throw new AppError(MESSAGES.STUDENT.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(filter: FilterQuery<StudentAuthUser & Document>, session?: ClientSession): Promise<(StudentAuthUser & Document) | null> {
    try {
      logger.debug(`Finding one student with filter:`, filter);
      const result = await this.model.findOne(filter).session(session || null).lean().exec();
      return result as unknown as (StudentAuthUser & Document) || null;
    } catch (error) {
      logger.error(`Error finding student with filter:`, error);
      throw new AppError(MESSAGES.STUDENT.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async count(filter?: FilterQuery<StudentAuthUser>): Promise<number> {
    try {
      const count = await this.model.countDocuments(filter || {}).exec();
      return count;
    } catch (error) {
      logger.error(`Error counting student records:`, error);
      throw new AppError(MESSAGES.STUDENT.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async block(id: string): Promise<StudentAuthUser & Document> {
    return this.blockStudent(id) as unknown as (StudentAuthUser & Document);
  }

  async unblock(id: string): Promise<StudentAuthUser & Document> {
    return this.unblockStudent(id) as unknown as (StudentAuthUser & Document);
  }

  async isBlocked(id: string): Promise<boolean> {
    try {
      const user = await this.model.findById(id).select('isBlocked').lean().exec();
      if (!user) throw new AppError(MESSAGES.STUDENT.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      return !!(user as { isBlocked?: boolean }).isBlocked;
    } catch (error) {
      logger.error(`Error checking blocked status for student with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(MESSAGES.STUDENT.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async createUser(data: AuthUser): Promise<AuthUser> {
    try {
      logger.debug(`Creating student user: ${data.email}`);

      const studentData: StudentAuthUser = {
        ...data,
        role: "student",
        isProfileComplete: StudentMapper.isProfileComplete(data as unknown as AuthUser),
        isVerified: data.isVerified || false,
        isPaid: false,
        approvalStatus: "approved",
      };

      const newStudent = await this.create(studentData);
      logger.info(`Student user created successfully: ${data.email}`);

      return StudentMapper.toAuthUser(newStudent);
    } catch (error) {
      logger.error("Error creating student user:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        MESSAGES.STUDENT.CREATE_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findAllStudents(): Promise<StudentBaseResponseDto[]> {
    try {
      logger.debug("Finding all students");
      const students = await this.model
        .find()
        .select("-password")
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      logger.info(`Found ${students.length} students`);
      return students.map((student) =>
       StudentMapper.toStudentResponseDto(student as unknown as StudentAuthUser)
      );
    } catch (error) {
      logger.error("Error finding all students:", error);
      throw new AppError(
        MESSAGES.STUDENT.FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

async countStudents(): Promise<number> {
  try {
    const count = await this.model.countDocuments({ role: "student" });
    logger.debug(`Total students count: ${count}`);
    return count;
  } catch (error) {
    logger.error("Error counting students:", error);
    throw new AppError(
      "Failed to count students",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


  // src/repositories/studentRepository.ts - Fix the findAllWithTrialStats method
async findAllWithTrialStats(page: number, limit: number) {
  try {
    const skip = (page - 1) * limit;

    const studentsWithStats = await StudentModel.aggregate([
      {
        $lookup: {
          from: "trialclasses", // Make sure this matches your MongoDB collection name
          localField: "_id",
          foreignField: "student",
          as: "trialClasses"
        }
      },
      {
        $addFields: {
          totalTrialClasses: { $size: "$trialClasses" },
          pendingTrialClasses: {
            $size: {
              $filter: {
                input: "$trialClasses",
                as: "trial",
                cond: { 
                  $in: ["$$trial.status", ["requested", "assigned"]] 
                }
              }
            }
          }
        }
      },
      {
        $project: {
          
          
          password: 0,
          trialClasses: 0
        }
      },
      { $skip: skip },
      { $limit: limit },
      { $sort: { createdAt: -1 } }
    ]);

    const totalStudents = await StudentModel.countDocuments();

    return {
      students: studentsWithStats,
      totalStudents
    };
  } catch (error) {
    logger.error("StudentRepository: Error finding students with trial stats", error);
    throw new AppError(
      "Failed to fetch students with trial statistics",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

  async findAllStudentsPaginated(params: StudentPaginationParams): Promise<StudentPaginatedResult> {
    try {
      const { page, limit, skip } = getPaginationParams(params as unknown as Record<string, unknown>);
      const search = params.search?.trim() || '';
      const status = params.status || '';
      const verification = params.verification || '';

     
      const matchStage: FilterQuery<StudentAuthUser> = {};

      
      if (search) {
        matchStage.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }

      
      if (status === 'active') {
        matchStage.isBlocked = { $ne: true };
      } else if (status === 'blocked') {
        matchStage.isBlocked = true;
      }

      
      if (verification === 'verified') {
        matchStage.isVerified = true;
      } else if (verification === 'pending') {
        matchStage.isVerified = { $ne: true };
      }

      logger.info(`findAllStudentsPaginated: Query=${JSON.stringify(matchStage)}, page=${page}, limit=${limit}`);

      
      const pipeline: PipelineStage[] = [];
      
      
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
      }

      pipeline.push(
        {
          $lookup: {
            from: "trialclasses",
            localField: "_id",
            foreignField: "student",
            as: "trialClasses"
          }
        },
        {
          $addFields: {
            totalTrialClasses: { $size: "$trialClasses" },
            pendingTrialClasses: {
              $size: {
                $filter: {
                  input: "$trialClasses",
                  as: "trial",
                  cond: { 
                    $in: ["$$trial.status", ["requested", "assigned"]] 
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            password: 0,
            trialClasses: 0
          }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      );

      const [students, total] = await Promise.all([
        this.model.aggregate(pipeline),
        this.model.countDocuments(matchStage)
      ]);

      // Add signed URLs for profile pictures
      const studentsWithImages = await Promise.all(
        students.map(async (student) => {
          const s = student as (StudentAuthUser & { profileImageUrl?: string | null });
          if (s.profileImage) {
            try {
              if (s.profileImage.startsWith('http')) {
                  s.profileImageUrl = s.profileImage;
              } else {
                  s.profileImageUrl = await getSignedFileUrl(s.profileImage);
              }
            } catch (error) {
              logger.error(`Error generating signed URL for student: ${s._id}`, error);
              s.profileImageUrl = null;
            }
          }
          return s;
        })
      );

      logger.info(`findAllStudentsPaginated: Found ${studentsWithImages.length} students, total=${total}`);

      return {
        students: studentsWithImages,
        total
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error in findAllStudentsPaginated: ${errorMessage}`);
      throw new AppError(
        MESSAGES.STUDENT.FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findStudentProfileById(id: string): Promise<DetailedStudentProfile | null> {
    try {
      logger.debug(`Finding complete student profile by ID: ${id}`);
      logger.info(`Initiating detailed student profile fetch: ${id}`);
      
      const student = await this.model
        .findById(id)
        .select("-password")
        .populate({
          path: 'gradeId',
          select: 'name grade'
        })
        .populate({
          path: 'preferredSubjects',
          select: 'subjectName'
        })
        .populate({
          path: 'preferredTimeSlots.subjectId',
          select: 'subjectName syllabus'
        })
        .populate({
          path: 'preferredTimeSlots.assignedMentorId',
          select: 'fullName email'
        })
        .lean()
        .exec();

      if (!student) {
        logger.debug(`Student not found with ID: ${id}`);
        return null;
      }

      // Fetch trial classes separately
      const { TrialClass } = await import("../models/student/trialClass.model.js");
      const trialClasses = await TrialClass
        .find({ student: id })
        .populate('subject', 'subjectName')
        .populate('mentor', 'fullName email')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      // Fetch enrollments separately
      const { Enrollment } = await import("../models/enrollment.model.js");
      const enrollments = await Enrollment
        .find({ student: id })
        .populate({
          path: 'course',
          populate: [
            { path: 'subject', select: 'subjectName' },
            { path: 'grade', select: 'name' },
            { path: 'mentor', select: 'fullName email' }
          ]
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      logger.info(`Student profile found with ${trialClasses.length} trial classes and ${enrollments.length} enrollments`);
      
      let profileImageUrl = null;
      // profileImageUrl is already declared above
      console.log(`🔍 [DEBUG] Processing profile image for student ${id}`);
      console.log(`🔍 [DEBUG] Student keys: ${Object.keys(student).join(', ')}`);
      
      const imageKey = student.profileImage || student.profileImageKey;
      
      if (imageKey) {
          console.log(`🔍 [DEBUG] Found image key: ${imageKey}`);
          try {
             if (imageKey.startsWith('http')) {
                 console.log("🔍 [DEBUG] property is already a URL");
                 profileImageUrl = imageKey;
             } else {
                 console.log("🔍 [DEBUG] Generating signed URL...");
                 profileImageUrl = await getSignedFileUrl(imageKey);
                 console.log(`🔍 [DEBUG] Generated URL: ${profileImageUrl ? 'Yes' : 'No'}`);
             }
          } catch (error) {
              console.error(`❌ [DEBUG] Error generating signed URL for student: ${student._id}`, error);
              logger.error(`Error generating signed URL for student: ${student._id}`, error);
          }
      } else {
          console.log("🔍 [DEBUG] No profileImage or profileImageKey found in student document");
      }

      const baseProfile = StudentMapper.toStudentAuthUser(student as unknown as StudentAuthUser);

      return {
        ...baseProfile,
        profileImageUrl,
        trialClasses,
        enrollments
      } as DetailedStudentProfile;
    } catch (error) {
      logger.error(`Error finding student profile by ID: ${id}`, error);
      throw new AppError(
        MESSAGES.STUDENT.FETCH_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
  async updatePreferredTimeSlotStatus(
    studentId: string,
    subjectId: string,
    status: 'mentor_assigned' | 'mentor_requested' | 'preferences_submitted',
    mentorId?: string
  ): Promise<void> {
    try {
      logger.debug(`Updating time slot status for student ${studentId}, subject ${subjectId} to ${status}`);
      
      const updateQuery: {
        $set: Record<string, unknown>;
        $unset?: Record<string, string>;
      } = {
        $set: {
          "preferredTimeSlots.$[elem].status": status
        }
      };

      if (mentorId) {
        updateQuery.$set["preferredTimeSlots.$[elem].assignedMentorId"] = mentorId;
      } else if (status === 'preferences_submitted') {
        updateQuery.$unset = {
           "preferredTimeSlots.$[elem].assignedMentorId": ""
        };
      }

      await this.model.updateOne(
        { _id: studentId },
        updateQuery,
        {
          arrayFilters: [{ "elem.subjectId": subjectId }]
        }
      );
      
      logger.info(`Updated time slot status for student ${studentId} to ${status}`);
    } catch (error) {
      logger.error(`Error updating time slot status:`, error);
      throw new AppError(MESSAGES.STUDENT.UPDATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async searchStudents(query: string): Promise<unknown[]> {
    try {
      logger.debug(`Searching students with query: ${query}`);
      const searchRegex = new RegExp(query, 'i');
      const students = await this.model
        .find({
          role: 'student',
          $or: [
            { fullName: searchRegex },
            { email: searchRegex }
          ]
        })
        .select('_id fullName email profileImage')
        .limit(10)
        .lean()
        .exec();

      const studentsWithImages = await Promise.all(
        students.map(async (s) => {
          const student = s as Record<string, unknown>;
          if (student.profileImage && typeof student.profileImage === 'string') {
            try {
              if (student.profileImage.startsWith('http')) {
                student.profileImageUrl = student.profileImage;
              } else {
                student.profileImageUrl = await getSignedFileUrl(student.profileImage);
              }
            } catch (error) {
              logger.error(`Error generating signed URL for student: ${student._id}`, error);
            }
          }
          return student;
        })
      );

      return studentsWithImages;
    } catch (error) {
      logger.error("Error searching students:", error);
      throw new AppError(MESSAGES.STUDENT.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async incrementCancellationCount(studentId: string, session?: ClientSession): Promise<void> {
    await this.model.findByIdAndUpdate(
      studentId,
      { $inc: { cancellationCount: 1 } },
      { session: session || null }
    ).exec();
  }

  
}
