import { MentorModel } from "../models/mentor.model";
import type {
  AuthUser,
  MentorAuthUser,
} from "../interfaces/auth/auth.interface";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository";
import type { RegisterUserDto } from "../dto/auth/RegisteruserDTO";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import type { IMentorAuthRepository } from "../interfaces/repositories/IMentorAuthRepository";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "@/utils/AppError";
import { injectable } from "inversify";


@injectable()
export class MentorAuthRepository
  implements IAuthRepository<MentorAuthUser>, IMentorAuthRepository, IVerificationRepository<MentorAuthUser>
{
  async findByEmail(email: string): Promise<MentorAuthUser | null> {
    try {
      const mentor = await MentorModel.findOne({ email }).lean();
      if (!mentor) {
        logger.warn(`Mentor not found by email: ${email}`);
        return null;
      }
      logger.info(`Mentor found by email: ${email}`);

       const academicQualifications = mentor.academicQualifications 
        ? mentor.academicQualifications.map(q => ({
            institutionName: q.institutionName,
            degree: q.degree,
            graduationYear: q.graduationYear
          }))
        : undefined;

      const subjectProficiency = mentor.subjectProficiency
        ? mentor.subjectProficiency.map(s => ({
            subject: s.subject,
            level: s.level
          }))
        : undefined;

const result: MentorAuthUser = {
        _id: mentor._id.toString(),
        fullName: mentor.fullName,
        email: mentor.email,
        password: mentor.password || '',
        phoneNumber: mentor.phoneNumber,
        role: "mentor",
        isVerified: mentor.isVerified ?? false,
        approvalStatus: mentor.approvalStatus || "pending",
        academicQualifications,
        subjectProficiency,
      };

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Error finding mentor by email: ${email} - ${errorMessage}`
      );
      throw new AppError(
        "Failed to find mentor by email",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async markUserVerified(email: string): Promise<void> {
    try {
      const result = await MentorModel.updateOne(
        { email },
        { $set: { isVerified: true } }
      );
      if (result.matchedCount === 0) {
        logger.warn(`Mentor not found for verification: ${email}`);
        throw new AppError(
          `Mentor with email ${email} not found`,
          HttpStatusCode.NOT_FOUND
        );
      }
      logger.info(`Mentor verified successfully: ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error verifying mentor: ${email} - ${errorMessage}`);
      throw error;
    }
  }

  async findById(id: string): Promise<MentorAuthUser | null> {
    try {
      const mentor = await MentorModel.findById(id).lean();
      if (!mentor) {
        logger.warn(`Mentor not found by ID: ${id}`);
        return null;
      }
      logger.info(`Mentor found by ID: ${id}`);

      const academicQualifications = mentor.academicQualifications 
        ? mentor.academicQualifications.map(q => ({
            institutionName: q.institutionName,
            degree: q.degree,
            graduationYear: q.graduationYear
          }))
        : undefined;

      const subjectProficiency = mentor.subjectProficiency
        ? mentor.subjectProficiency.map(s => ({
            subject: s.subject,
            level: s.level
          }))
        : undefined;

      return {
        _id: mentor._id.toString(),
        fullName: mentor.fullName,
        email: mentor.email,
        password: mentor.password || '',
        phoneNumber: mentor.phoneNumber,
        role: "mentor",
        isVerified: mentor.isVerified ?? false,
        approvalStatus: mentor.approvalStatus || "pending",
        academicQualifications,
        subjectProficiency,
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding mentor by ID: ${id} - ${errorMessage}`);
      throw new AppError(
        "Failed to find mentor by ID",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async comparePasswords(user: AuthUser, password: string): Promise<boolean> {
    try {
      if (!user.password) {
        logger.warn(`No password found for user: ${user.email}`);
        throw new AppError("User password not found", HttpStatusCode.BAD_REQUEST);
      }

      return await bcrypt.compare(password, user.password);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Error comparing passwords for user: ${user.email} - ${errorMessage}`
      );
      throw new AppError(
        "Password comparison failed",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateProfile(
    id: string,
    data: Partial<MentorProfile>
  ): Promise<MentorProfile | null> {
    try {
      const updatedMentor = await MentorModel.findByIdAndUpdate(id, data, {
        new: true,
      }).lean();
      if (updatedMentor) logger.info(`Mentor profile updated: ${id}`);
      else logger.warn(`Mentor profile update failed: ${id}`);
      return updatedMentor || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error updating mentor profile: ${id} - ${errorMessage}`);
      throw new AppError(
        "Failed to update mentor profile",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateVerificationStatus(
    id: string,
    isVerified: boolean,
    reason?: string
  ): Promise<MentorProfile | null> {
    try {
      const update: Partial<MentorProfile> = { isVerified };
      if (reason) update.rejectionReason = reason;

      const updatedMentor = await MentorModel.findByIdAndUpdate(id, update, {
        new: true,
      }).lean();
      if (updatedMentor)
        logger.info(
          `Mentor verification status updated: ${id}, verified=${isVerified}`
        );
      else logger.warn(`Mentor verification update failed: ${id}`);
      return updatedMentor || null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Error updating verification status for mentor: ${id} - ${errorMessage}`
      );
      throw new AppError(
        "Failed to update verification status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createUser(data: AuthUser | RegisterUserDto): Promise<MentorAuthUser> {
    try {
      const { role: _role, ...dataWithoutRole } = data;
      const createdMentor = await MentorModel.create(dataWithoutRole);
      logger.info(`Mentor created: ${createdMentor.email}`);
      return {
        _id: createdMentor._id.toString(),
        fullName: createdMentor.fullName,
        email: createdMentor.email,
        password: createdMentor.password,
        phoneNumber: createdMentor.phoneNumber,
        role: "mentor",
        isVerified: createdMentor.isVerified ?? false,
        approvalStatus: createdMentor.approvalStatus || "pending",
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error creating mentor: ${data.email} - ${errorMessage}`);
      throw new AppError(
        "Failed to create mentor",
        HttpStatusCode.BAD_REQUEST
      );
    }
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    try {
      const result = await MentorModel.updateOne(
        { email },
        { password: hashedPassword }
      );
      if (result.matchedCount === 0) {
        logger.warn(`Mentor password update failed, email not found: ${email}`);
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }
      logger.info(`Mentor password updated: ${email}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Error updating password for mentor: ${email} - ${errorMessage}`
      );
      throw new AppError(
        "Failed to update password",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async block(id: string): Promise<boolean> {
    try {
      const result = await MentorModel.findByIdAndUpdate(id, {
        isBlocked: true,
      });
      if (result) logger.info(`Mentor blocked: ${id}`);
      else logger.warn(`Mentor block failed, ID not found: ${id}`);
      return result !== null;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error blocking mentor: ${id} - ${errorMessage}`);
      throw new AppError(
        "Failed to block mentor",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async blockMentor(id: string): Promise<boolean> {
    return this.block(id);
  }

  async listAllMentor(): Promise<MentorProfile[]> {
    try {
      const mentors = await MentorModel.find({}).lean();
      logger.info(`Listed all mentors: count=${mentors.length}`);
      return mentors;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error listing mentors - ${errorMessage}`);
      throw new AppError(
        "Failed to list mentors",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}