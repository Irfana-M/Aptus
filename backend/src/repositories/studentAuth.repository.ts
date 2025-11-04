import { StudentModel } from "../models/student.model";
import type { StudentProfile } from "../interfaces/models/student.interface";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository";
import type { IStudentAuthRepository } from "../interfaces/repositories/IStudentAuthRepository";
import type { RegisterUserDto } from "../dto/auth/RegisteruserDTO";
import type { AuthUser, StudentAuthUser } from "../interfaces/auth/auth.interface";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger";
import { injectable } from "inversify";
@injectable()

export class StudentAuthRepository
  implements IAuthRepository, IStudentAuthRepository, IVerificationRepository
{
  async findByEmail(email: string): Promise<StudentAuthUser | null> {
    try {
      const student = await StudentModel.findOne({ email }).lean();
      if (!student) {
        logger.warn(`Student not found with email: ${email}`);
        return null;
      }
      logger.info(`Student found with email: ${email}`);
      return {
        _id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
        password: student.password || '',
        phoneNumber: student.phoneNumber,
        role: "student",
        isVerified: student.isVerified ?? false,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding student by email ${email}: ${errorMessage}`);
      throw new Error("Failed to find student by email");
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

  async findById(id: string): Promise<StudentAuthUser | null> {
    try {
      const student = await StudentModel.findById(id).lean();
      if (!student) {
        logger.warn(`Student not found with ID: ${id}`);
        return null;
      }
      logger.info(`Student found with ID: ${id}`);
      return {
        _id: student._id.toString(),
        fullName: student.fullName,
        email: student.email,
        password: student.password || '',
        phoneNumber: student.phoneNumber,
        role: "student",
        isVerified: student.isVerified ?? false,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding student by ID ${id}: ${errorMessage}`);
      throw new Error("Failed to find student by ID");
    }
  }

  async createUser(data: AuthUser | RegisterUserDto): Promise<AuthUser> {
    try {
      const { role: _role, ...dataWithoutRole } = data;
      const createdStudent = await StudentModel.create(dataWithoutRole);
      logger.info(`Student created: ${createdStudent.email}`);
      return {
        _id: createdStudent._id.toString(),
        fullName: createdStudent.fullName,
        email: createdStudent.email,
        password: createdStudent.password || '',
        phoneNumber: createdStudent.phoneNumber,
        role: "student",
        isVerified: createdStudent.isVerified ?? false,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to create student ${data.email}: ${errorMessage}`);
      throw new Error("Failed to create student");
    }
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    try {
      const result = await StudentModel.updateOne(
        { email },
        { password: hashedPassword }
      );
      if (result.matchedCount === 0) {
        logger.warn(`Student not found for password update: ${email}`);
        throw new Error("Student not found");
      }
      logger.info(`Password updated for student: ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to update password for ${email}: ${errorMessage}`);
      throw new Error("Failed to update password");
    }
  }

  async markUserVerified(email: string): Promise<void> {
    try {
      const result = await StudentModel.updateOne(
        { email },
        { $set: { isVerified: true } }
      );
      if (result.matchedCount === 0) {
        logger.warn(`Student not found to mark verified: ${email}`);
        throw new Error(`Student not found: ${email}`);
      }
      logger.info(`Student marked verified: ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error marking student verified ${email}: ${errorMessage}`);
      throw new Error("Failed to mark student as verified");
    }
  }

  async block(id: string): Promise<boolean> {
    return this.blockStudent(id);
  }

  async updateProfile(
    id: string,
    data: Partial<StudentProfile>
  ): Promise<StudentProfile | null> {
    try {
      const updated = await StudentModel.findByIdAndUpdate(id, data, {
        new: true,
      }).lean();
      if (!updated) {
        logger.warn(`Student not found for profile update: ${id}`);
        return null;
      }
      logger.info(`Student profile updated: ${id}`);
      return updated;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Failed to update profile for student ${id}: ${errorMessage}`
      );
      throw new Error("Failed to update student profile");
    }
  }

  async blockStudent(id: string): Promise<boolean> {
    try {
      const result = await StudentModel.findByIdAndUpdate(id, {
        $set: { isBlocked: true },
      });
      if (!result) {
        logger.warn(`Student not found to block: ${id}`);
        return false;
      }
      logger.info(`Student blocked: ${id}`);
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to block student ${id}: ${errorMessage}`);
      throw new Error("Failed to block student");
    }
  }

  async listAllStudents(): Promise<StudentProfile[]> {
    try {
      const students = await StudentModel.find({}).lean();
      logger.info(`Listed all students, count: ${students.length}`);
      return students;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Failed to list all students: ${errorMessage}`);
      throw new Error("Failed to list students");
    }
  }
}