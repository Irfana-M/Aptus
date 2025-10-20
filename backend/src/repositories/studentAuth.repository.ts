import { StudentModel } from "../models/student.model.js";
import type { StudentProfile } from "../interfaces/models/student.interface.js";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";

export class StudentAuthRepository
  implements IAuthRepository, IStudentRepository, IVerificationRepository
{
  async findByEmail(email: string): Promise<AuthUser | null> {
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
        password: student.password,
        phoneNumber: student.phoneNumber,
        role: "student",
        isVerified: student.isVerified ?? false,
      };
    } catch (error: any) {
      logger.error(`Error finding student by email ${email}: ${error.message}`);
      throw new Error("Failed to find student by email");
    }
  }

  async comparePassword(user: AuthUser, password: string): Promise<boolean> {
    try {
      const result = await bcrypt.compare(password, user.password);
      return result;
    } catch (error: any) {
      logger.error(`Error comparing password for ${user.email}: ${error.message}`);
      throw new Error("Password comparison failed");
    }
  }

  async findById(id: string): Promise<AuthUser | null> {
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
        password: student.password,
        phoneNumber: student.phoneNumber,
        role: "student",
        isVerified: student.isVerified ?? false,
      };
    } catch (error: any) {
      logger.error(`Error finding student by ID ${id}: ${error.message}`);
      throw new Error("Failed to find student by ID");
    }
  }

  async createUser(data: AuthUser | RegisterUserDto): Promise<AuthUser> {
    try {
      const { role, ...dataWithoutRole } = data as any;
      const createdStudent = await StudentModel.create(dataWithoutRole);
      logger.info(`Student created: ${createdStudent.email}`);
      return {
        _id: createdStudent._id.toString(),
        fullName: createdStudent.fullName,
        email: createdStudent.email,
        password: createdStudent.password,
        phoneNumber: createdStudent.phoneNumber,
        role: "student",
        isVerified: createdStudent.isVerified ?? false,
      };
    } catch (error: any) {
      logger.error(`Failed to create student ${data.email}: ${error.message}`);
      throw new Error("Failed to create student");
    }
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    try {
      const result = await StudentModel.updateOne({ email }, { password: hashedPassword });
      if (result.matchedCount === 0) {
        logger.warn(`Student not found for password update: ${email}`);
        throw new Error("Student not found");
      }
      logger.info(`Password updated for student: ${email}`);
    } catch (error: any) {
      logger.error(`Failed to update password for ${email}: ${error.message}`);
      throw new Error("Failed to update password");
    }
  }

  async markUserVerified(email: string): Promise<void> {
    try {
      const result = await StudentModel.updateOne({ email }, { $set: { isVerified: true } });
      if (result.matchedCount === 0) {
        logger.warn(`Student not found to mark verified: ${email}`);
        throw new Error(`Student not found: ${email}`);
      }
      logger.info(`Student marked verified: ${email}`);
    } catch (error: any) {
      logger.error(`Error marking student verified ${email}: ${error.message}`);
      throw new Error("Failed to mark student as verified");
    }
  }

  async block(id: string): Promise<boolean> {
    return this.blockStudent(id);
  }

  async updateProfile(id: string, data: Partial<StudentProfile>): Promise<StudentProfile | null> {
    try {
      const updated = await StudentModel.findByIdAndUpdate(id, data, { new: true }).lean();
      if (!updated) {
        logger.warn(`Student not found for profile update: ${id}`);
        return null;
      }
      logger.info(`Student profile updated: ${id}`);
      return updated;
    } catch (error: any) {
      logger.error(`Failed to update profile for student ${id}: ${error.message}`);
      throw new Error("Failed to update student profile");
    }
  }

  async blockStudent(id: string): Promise<boolean> {
    try {
      const result = await StudentModel.findByIdAndUpdate(id, { $set: { isBlocked: true } });
      if (!result) {
        logger.warn(`Student not found to block: ${id}`);
        return false;
      }
      logger.info(`Student blocked: ${id}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to block student ${id}: ${error.message}`);
      throw new Error("Failed to block student");
    }
  }

  async listAllStudents(): Promise<StudentProfile[]> {
    try {
      const students = await StudentModel.find({}).lean();
      logger.info(`Listed all students, count: ${students.length}`);
      return students;
    } catch (error: any) {
      logger.error(`Failed to list all students: ${error.message}`);
      throw new Error("Failed to list students");
    }
  }
}
