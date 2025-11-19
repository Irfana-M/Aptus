import type { IStudentRepository } from "@/interfaces/repositories/IStudentRepository";
import type {
  StudentAuthUser,
  AuthUser,
} from "@/interfaces/auth/auth.interface";
import type { StudentProfile } from "@/interfaces/models/student.interface";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import { BaseRepository } from "./baseRepository";
import { StudentModel } from "@/models/student/student.model";
import { StudentMapper } from "@/mappers/StudentMapper";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { injectable } from "inversify";

@injectable()
export class StudentRepository
  extends BaseRepository<StudentAuthUser>
  implements IStudentRepository
{
  constructor() {
    super(StudentModel);
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

      logger.info(`Student found with email: ${email}`);
      return StudentMapper.toStudentAuthUser(student); 
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
      const student = await this.model
        .findById(id)
        .where("role")
        .equals("student")
        .lean()
        .exec();

      if (!student) {
        logger.debug(`Student not found with ID: ${id}`);
        return null;
      }

      logger.info(`Student found with ID: ${id}`);
      return StudentMapper.toStudentAuthUser(student); 
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

      const result = await this.updateById(
        id,
        updateData as Partial<StudentAuthUser>
      );
      return StudentMapper.toResponseDto(result);
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

      const blockedStudent = await this.block(id);
      logger.info(`Student blocked successfully: ${id}`);
      return StudentMapper.toStudentAuthUser(blockedStudent);
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
    
    const unblockedStudent = await this.unblock(id);
    logger.info(`Student unblocked successfully: ${id}`);
    
    return StudentMapper.toStudentAuthUser(unblockedStudent);
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

  async createUser(data: AuthUser): Promise<AuthUser> {
    try {
      logger.debug(`Creating student user: ${data.email}`);

      const studentData: StudentAuthUser = {
        ...data,
        role: "student",
        isProfileComplete: StudentMapper.isProfileComplete(data),
        isVerified: data.isVerified || false,
        isPaid: false,
        approvalStatus: "approved",
      };

      const newStudent = await super.create(studentData);
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
      return students.map((student: any) =>
       StudentMapper.toStudentResponseDto(student)
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
}
