import type { IStudentRepository } from "@/interfaces/repositories/IStudentRepository";
import type {
  AuthUser,
  StudentAuthUser,
} from "@/interfaces/auth/auth.interface";
import type { StudentProfile } from "@/interfaces/models/student.interface";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import { BaseRepository } from "./baseRepository";
import { StudentModel } from "@/models/student.model";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import { injectable } from "inversify";

@injectable()
export class StudentRepository
  extends BaseRepository<StudentAuthUser>
  implements IStudentRepository
{
  private studentModel: any;

  constructor() {
    super(StudentModel);
    this.studentModel = StudentModel;
  }

  async findByEmail(email: string): Promise<StudentAuthUser | null> {
    try {
      const student = await this.studentModel
        .findOne({ email, role: "student" })
        .select("+password")
        .lean()
        .exec();

      if (!student) {
        return null;
      }

      return student as StudentAuthUser;
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
      const student = await this.studentModel
        .findById(id)
        .where("role")
        .equals("student")
        .lean()
        .exec();

      if (!student) {
        return null;
      }

      return student as StudentAuthUser;
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
      const existingStudent = await this.studentModel
        .findById(id)
        .where("role")
        .equals("student")
        .exec();

      if (!existingStudent) {
        throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
      }

      const updatedStudent = await this.studentModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              ...data,
              ...(this.isProfileComplete(data)
                ? { isProfileComplete: true }
                : {}),
            },
          },
          {
            new: true,
            runValidators: true,
          }
        )
        .lean()
        .exec();

      return updatedStudent;
    } catch (error) {
      logger.error("Error updating student profile:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to update student profile",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async blockStudent(id: string): Promise<boolean> {
    try {
      const result = await this.studentModel
        .findByIdAndUpdate(
          id,
          {
            $set: {
              isBlocked: true,
              blockedAt: new Date(),
            },
          },
          { new: true }
        )
        .exec();

      if (!result) {
        throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
      }

      return true;
    } catch (error) {
      logger.error("Error blocking student:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to block student",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async markUserVerified(email: string): Promise<void> {
    try {
      const result = await this.studentModel
        .findOneAndUpdate(
          { email, role: "student" },
          {
            $set: {
              isVerified: true,
              verifiedAt: new Date(),
            },
          }
        )
        .exec();

      if (!result) {
        throw new AppError(
          "Student not found with the provided email",
          HttpStatusCode.NOT_FOUND
        );
      }
    } catch (error) {
      logger.error("Error marking user as verified:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to mark user as verified",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createUser(data: AuthUser): Promise<AuthUser> {
    try {
      const studentData: StudentAuthUser = {
        ...data,
        role: "student",
        isProfileComplete: this.isProfileComplete(data),
        isVerified: data.isVerified || false,
        isPaid: (data as StudentAuthUser).isPaid || false,
        approvalStatus: "approved",
      };

      const newStudent = await super.create(studentData);

      return newStudent;
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
      const students = await this.studentModel
        .find()
        .select("-password")
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      console.log("students from student repo", students);
      logger.info(`Find all students from repository ${students}`);
      return students.map((student: any) =>
        this.mapToStudentResponseDto(student)
      );
    } catch (error) {
      logger.error("Error finding all students:", error);
      throw new AppError(
        "Failed to retrieve students",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  private isProfileComplete(data: Partial<StudentProfile | AuthUser>): boolean {
    const requiredFields = ["fullName", "email", "phoneNumber"];
    return requiredFields.every(
      (field) =>
        data[field as keyof typeof data] &&
        data[field as keyof typeof data] !== ""
    );
  }

  private mapToStudentResponseDto(student: any): StudentBaseResponseDto {
    return {
      _id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      phoneNumber: student.phoneNumber,
      role: student.role,
      isVerified: student.isVerified,
      isProfileComplete: student.isProfileComplete || false,
      isPaid: student.isPaid || false,
      approvalStatus: student.approvalStatus || "approved",
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,

      ...(student.gradeLevel && { gradeLevel: student.gradeLevel }),
      ...(student.school && { school: student.school }),
      ...(student.parentName && { parentName: student.parentName }),
      ...(student.parentPhone && { parentPhone: student.parentPhone }),
    };
  }

  async updateById(
    id: string,
    data: Partial<StudentAuthUser>
  ): Promise<StudentAuthUser> {
    try {
      if (data.role && data.role !== "student") {
        throw new AppError(
          "Cannot change user role through this method",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const updateData = {
        ...data,
        role: "student" as const,
        ...(this.isProfileComplete(data) ? { isProfileComplete: true } : {}),
      } as Partial<StudentAuthUser>;

      const result = await super.updateById(id, updateData as any);
      return result as StudentAuthUser;
    } catch (error) {
      logger.error("Error updating student:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to update student",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findStudentsByGrade(gradeLevel: string): Promise<StudentAuthUser[]> {
    try {
      const students = await this.studentModel
        .find({
          role: "student",
          gradeLevel,
        })
        .select("-password")
        .sort({ fullName: 1 })
        .lean()
        .exec();

      return students as StudentAuthUser[];
    } catch (error) {
      logger.error("Error finding students by grade:", error);
      throw new AppError(
        "Failed to find students by grade level",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPaidStudents(): Promise<StudentBaseResponseDto[]> {
    try {
      const students = await this.studentModel
        .find({
          role: "student",
          isPaid: true,
        })
        .select("-password")
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      return students.map((student: any) =>
        this.mapToStudentResponseDto(student)
      );
    } catch (error) {
      logger.error("Error finding paid students:", error);
      throw new AppError(
        "Failed to retrieve paid students",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}
