import type { IStudentRepository, StudentPaginatedResult } from "@/interfaces/repositories/IStudentRepository";
import type {
  StudentAuthUser,
  AuthUser,
} from "@/interfaces/auth/auth.interface";
import type { StudentProfile } from "@/interfaces/models/student.interface";
// BaseRepository import removed
import { StudentModel } from "@/models/student/student.model";
import { StudentMapper } from "@/mappers/StudentMapper";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { injectable } from "inversify";
import { getSignedFileUrl } from "@/utils/s3Upload";
import type { FilterQuery, PipelineStage } from "mongoose";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { StudentPaginationParams } from "@/dto/shared/paginationTypes";

export interface DetailedStudentProfile extends Partial<StudentAuthUser> {
  trialClasses: unknown[];
  enrollments: unknown[];
  profileImageUrl: string | null;
}

export interface DetailedStudentProfile extends Partial<StudentAuthUser> {
  trialClasses: unknown[];
  enrollments: unknown[];
  profileImageUrl: string | null;
}

@injectable()
export class StudentRepository
  implements IStudentRepository
{
  private model = StudentModel;

  constructor() {
    // constructor body empty
  }

  protected removeUndefinedProperties<T extends object>(
    obj: Partial<T>
  ): Partial<T> {
    const cleanObj: Partial<T> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        (cleanObj as Record<string, unknown>)[key] = value;
      }
    }
    return cleanObj;
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
        "Failed to find student by email",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findById(id: string): Promise<StudentAuthUser | null> {
    try {
      logger.debug(`Finding student by ID: ${id}`);
      const student = await this.model.findById(id).lean().exec();

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
      return StudentMapper.toStudentAuthUser({ ...student, role: "student" } as StudentAuthUser); 
    } catch (error) {
      logger.error("Error finding student by ID:", error);
      throw new AppError(
        "Failed to find student by ID",
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

      const updateData = StudentMapper.toProfileUpdate(data);

      const cleanUpdateData = this.removeUndefinedProperties(updateData);
      
      const result = await this.model
        .findByIdAndUpdate(id, cleanUpdateData, { new: true, runValidators: true })
        .lean()
        .exec();

      if (!result) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);

      return StudentMapper.toResponseDto(result as unknown as StudentAuthUser);
    } catch (error) {
      logger.error(`Error updating student profile: ${id}`, error);
      throw new AppError(
        "Failed to update student profile",
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

      if (!blockedStudent) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);

      logger.info(`Student blocked successfully: ${id}`);
      return StudentMapper.toStudentAuthUser(blockedStudent as unknown as StudentAuthUser);
    } catch (error) {
    logger.error(`Error blocking student: ${id}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to block student",
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

    if (!unblockedStudent) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);

    logger.info(`Student unblocked successfully: ${id}`);
    
    return StudentMapper.toStudentAuthUser(unblockedStudent as unknown as StudentAuthUser);
  } catch (error) {
    logger.error(`Error unblocking student: ${id}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to unblock student",
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
          "Student not found with the provided email",
          HttpStatusCode.NOT_FOUND
        );
      }

      logger.info(`Student marked as verified: ${email}`);
    } catch (error) {
      logger.error("Error marking student as verified:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to mark student as verified",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async create(data: Partial<StudentAuthUser>): Promise<StudentAuthUser> {
    try {
      logger.debug(`Creating new student`, { email: data.email });
      const result = await this.model.create(data);
      if (!result) throw new AppError("Failed to create student", HttpStatusCode.BAD_REQUEST);
      logger.info(`Student created successfully: ${result._id}`);
      return result as unknown as StudentAuthUser;
    } catch (error) {
      logger.error(`Error creating student:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to create student", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateById(id: string, data: Partial<StudentAuthUser>): Promise<StudentAuthUser> {
    try {
      logger.debug(`Updating student with ID: ${id}`);
      const cleanData = this.removeUndefinedProperties(data);
      const result = await this.model.findByIdAndUpdate(id, cleanData, { new: true, runValidators: true }).lean().exec();
      if (!result) throw new AppError(`Student update failed: ${id}`, HttpStatusCode.NOT_FOUND);
      logger.info(`Student updated successfully: ${id}`);
      return result as unknown as StudentAuthUser;
    } catch (error) {
      logger.error(`Error updating student with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to update student", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteById(id: string): Promise<boolean> {
    try {
      logger.debug(`Deleting student with ID: ${id}`);
      const result = await this.model.findByIdAndDelete(id).exec();
      if (!result) throw new AppError(`Student delete failed: ${id}`, HttpStatusCode.NOT_FOUND);
      logger.info(`Student deleted successfully: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting student with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to delete student", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(): Promise<StudentAuthUser[]> {
    try {
      logger.debug(`Finding all students`);
      const results = await this.model.find({}).lean().exec();
      logger.info(`Found ${results.length} students`);
      return results as unknown as StudentAuthUser[];
    } catch (error) {
      logger.error(`Error finding all students:`, error);
      throw new AppError("Failed to retrieve students", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(filter: FilterQuery<StudentAuthUser>): Promise<StudentAuthUser | null> {
    try {
      logger.debug(`Finding one student with filter:`, filter);
      const result = await this.model.findOne(filter).lean().exec();
      return result as unknown as StudentAuthUser || null;
    } catch (error) {
      logger.error(`Error finding student with filter:`, error);
      throw new AppError("Failed to find student", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async count(filter?: FilterQuery<StudentAuthUser>): Promise<number> {
    try {
      const count = await this.model.countDocuments(filter || {}).exec();
      return count;
    } catch (error) {
      logger.error(`Error counting student records:`, error);
      throw new AppError("Failed to count student records", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async block(id: string): Promise<StudentAuthUser> {
    return this.blockStudent(id);
  }

  async unblock(id: string): Promise<StudentAuthUser> {
    return this.unblockStudent(id);
  }

  async isBlocked(id: string): Promise<boolean> {
    try {
      const user = await this.model.findById(id).select('isBlocked').lean().exec();
      if (!user) throw new AppError(`Student not found: ${id}`, HttpStatusCode.NOT_FOUND);
      return !!(user as { isBlocked?: boolean }).isBlocked;
    } catch (error) {
      logger.error(`Error checking blocked status for student with ID ${id}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError("Failed to check blocked status", HttpStatusCode.INTERNAL_SERVER_ERROR);
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
        "Failed to create student user",
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
        "Failed to retrieve students",
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
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;
      const search = params.search?.trim() || '';
      const status = params.status || '';
      const verification = params.verification || '';

      // Build match stage for aggregation
      const matchStage: FilterQuery<StudentAuthUser> = {};

      // Search filter (fullName, email, phoneNumber)
      if (search) {
        matchStage.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phoneNumber: { $regex: search, $options: 'i' } }
        ];
      }

      // Status filter (active/blocked)
      if (status === 'active') {
        matchStage.isBlocked = { $ne: true };
      } else if (status === 'blocked') {
        matchStage.isBlocked = true;
      }

      // Verification filter
      if (verification === 'verified') {
        matchStage.isVerified = true;
      } else if (verification === 'pending') {
        matchStage.isVerified = { $ne: true };
      }

      logger.info(`findAllStudentsPaginated: Query=${JSON.stringify(matchStage)}, page=${page}, limit=${limit}`);

      // Use aggregation to include trial class stats
      const pipeline: PipelineStage[] = [];
      
      // Add match stage only if there are filters
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

      const students = await StudentModel.aggregate(pipeline);

      // Add signed URLs for profile pictures
      const studentsWithImages = await Promise.all(
        students.map(async (student) => {
          const s = student as (StudentAuthUser & { profileImageUrl?: string | null });
          if (s.profileImage) {
            try {
              if (s.profileImage.startsWith('http')) {
                  s.profileImageUrl = s.profileImage;
              } else {
                  // Assuming profileImage stores the Key
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

      // Count with same match conditions
      const total = await StudentModel.countDocuments(matchStage);

      logger.info(`findAllStudentsPaginated: Found ${studentsWithImages.length} students, total=${total}`);

      return {
        students: studentsWithImages,
        total
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error in findAllStudentsPaginated: ${errorMessage}`);
      throw new AppError(
        'Failed to fetch paginated students',
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findStudentProfileById(id: string): Promise<DetailedStudentProfile | null> {
    try {
      logger.debug(`Finding complete student profile by ID: ${id}`);
      
      const student = await this.model
        .findById(id)
        .select("-password")
        .populate({
          path: 'gradeId',
          select: 'name level'
        })
        .lean()
        .exec();

      if (!student) {
        logger.debug(`Student not found with ID: ${id}`);
        return null;
      }

      // Fetch trial classes separately
      const { TrialClass } = await import("@/models/student/trialClass.model");
      const trialClasses = await TrialClass
        .find({ student: id })
        .populate('subject', 'subjectName')
        .populate('mentor', 'fullName email')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      // Fetch enrollments separately
      const { Enrollment } = await import("@/models/enrollment.model");
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
        "Failed to find student profile",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }


}
