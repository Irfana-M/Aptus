import { StudentModel } from "../models/student/student.model";
import type { StudentProfile } from "../interfaces/models/student.interface";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository";
import type { IStudentAuthRepository } from "../interfaces/repositories/IStudentAuthRepository";
import type { RegisterUserDto } from "../dto/auth/RegisteruserDTO";
import type { AuthUser, StudentAuthUser } from "../interfaces/auth/auth.interface";
import { BaseRepository } from "./baseRepository";
import { StudentMapper } from "@/mappers/StudentMapper";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger";
import { injectable } from "inversify";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";

@injectable()
export class StudentAuthRepository
  extends BaseRepository<StudentAuthUser>
  implements IStudentAuthRepository, IVerificationRepository<StudentAuthUser>
{
  constructor() {
    super(StudentModel);
  }

 
  async findByEmail(email: string): Promise<StudentAuthUser | null> {
    try {
      const student = await this.findOne({ email });
      if (!student) {
        logger.warn(`Student not found with email: ${email}`);
        return null;
      }
      logger.info(`Student found with email: ${email}`);
      return StudentMapper.toStudentAuthUser(student);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding student by email ${email}: ${errorMessage}`);
      throw new AppError(
        "Failed to find student by email",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async findById(id: string): Promise<StudentAuthUser | null> {
    try {
      const student = await super.findById(id);
      if (!student) {
        logger.warn(`Student not found with ID: ${id}`);
        return null;
      }
      logger.info(`Student found with ID: ${id}`);
      return StudentMapper.toStudentAuthUser(student);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding student by ID ${id}: ${errorMessage}`);
      throw new AppError(
        "Failed to find student by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createUser(data: RegisterUserDto): Promise<StudentAuthUser> {
    try {
      const { role: _role, ...dataWithoutRole } = data;
      const studentData: Partial<StudentAuthUser> = {
        ...dataWithoutRole,
        role: "student",
        isVerified: false,
        isPaid: false,
        approvalStatus: "approved",
      };

      const createdStudent = await this.create(studentData);
      logger.info(`Student created: ${createdStudent.email}`);
      return StudentMapper.toStudentAuthUser(createdStudent);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to create student ${data.email}: ${errorMessage}`);
      throw new AppError(
        "Failed to create student",
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async markUserVerified(email: string): Promise<void> {
    try {
      const result = await this.model.updateOne(
        { email },
        { $set: { isVerified: true } }
      );
      if (result.matchedCount === 0) {
        logger.warn(`Student not found to mark verified: ${email}`);
        throw new AppError(`Student not found: ${email}`, HttpStatusCode.NOT_FOUND);
      }
      logger.info(`Student marked verified: ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error marking student verified ${email}: ${errorMessage}`);
      throw new AppError(
        "Failed to mark student as verified",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async block(id: string): Promise<StudentAuthUser> {
    try {
      logger.debug(`Blocking student: ${id}`);
      const blockedStudent = await super.block(id);
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

  async unblock(id: string): Promise<StudentAuthUser> {
    try {
      logger.debug(`Unblocking student: ${id}`);
      const unblockedStudent = await super.unblock(id);
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

 
  async comparePassword(user: AuthUser, password: string): Promise<boolean> {
    try {
      if (!user.password) {
        logger.warn(
          `Cannot compare password - user has no password stored: ${user.email}`
        );
        return false;
      }
      const result = await bcrypt.compare(password, user.password);
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Error comparing password for ${user.email}: ${errorMessage}`
      );
      throw new Error("Password comparison failed");
    }
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    try {
      const result = await this.model.updateOne(
        { email },
        { password: hashedPassword }
      );
      if (result.matchedCount === 0) {
        logger.warn(`Student not found for password update: ${email}`);
        throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
      }
      logger.info(`Password updated for student: ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to update password for ${email}: ${errorMessage}`);
      throw new AppError(
        "Failed to update password",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateProfile(
    id: string,
    data: Partial<StudentProfile>
  ): Promise<StudentProfile | null> {
    try {
      const updateData = StudentMapper.toProfileUpdate(data);
      const updated = await this.updateById(id, updateData as Partial<StudentAuthUser>);
      if (!updated) {
        logger.warn(`Student not found for profile update: ${id}`);
        return null;
      }
      logger.info(`Student profile updated: ${id}`);
      return StudentMapper.toResponseDto(updated);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to update profile for student ${id}: ${errorMessage}`
      );
      throw new AppError(
        "Failed to update student profile",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async listAllStudents(): Promise<StudentProfile[]> {
    try {
      const students = await this.findAll();
      logger.info(`Listed all students, count: ${students.length}`);
      return students.map(student => StudentMapper.toResponseDto(student));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to list all students: ${errorMessage}`);
      throw new AppError(
        "Failed to list students",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  
  async updateVerificationStatus(
    id: string,
    isVerified: boolean,
    reason?: string
  ): Promise<StudentAuthUser | null> {
    try {
      const update: Partial<StudentAuthUser> = { isVerified };
      if (reason) (update as any).rejectionReason = reason;

      const updatedStudent = await this.updateById(id, update);
      if (updatedStudent) {
        logger.info(
          `Student verification status updated: ${id}, verified=${isVerified}`
        );
      } else {
        logger.warn(`Student verification update failed: ${id}`);
      }
      return updatedStudent;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Error updating verification status for student: ${id} - ${errorMessage}`
      );
      throw new AppError(
        "Failed to update verification status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

 
  async create(data: Partial<StudentAuthUser>): Promise<StudentAuthUser> {
    const result = await super.create(data);
    return StudentMapper.toStudentAuthUser(result);
  }

  async updateById(id: string, data: Partial<StudentAuthUser>): Promise<StudentAuthUser> {
    const result = await super.updateById(id, data);
    return StudentMapper.toStudentAuthUser(result);
  }

  async findAll(): Promise<StudentAuthUser[]> {
    const students = await super.findAll();
    return students.map(student => StudentMapper.toStudentAuthUser(student));
  }
}