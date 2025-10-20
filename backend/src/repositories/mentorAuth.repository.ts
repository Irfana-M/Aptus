import { MentorModel } from "../models/mentor.model.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import type { MentorProfile } from "../interfaces/models/mentor.interface.js";
import type { IMentorAuthRepository } from "../interfaces/repositories/IMentorRepository.js";
import bcrypt from "bcryptjs";
import { logger } from "../utils/logger.js";
import { HttpStatusCode } from "../constants/httpStatus.js";

export class MentorAuthRepository implements IAuthRepository, IMentorAuthRepository, IVerificationRepository {

  async findByEmail(email: string): Promise<AuthUser | null> {
    try {
      const mentor = await MentorModel.findOne({ email }).lean();
      if (!mentor) {
        logger.warn(`Mentor not found by email: ${email}`);
        return null;
      }
      logger.info(`Mentor found by email: ${email}`);
      return {
        _id: mentor._id.toString(),
        fullName: mentor.fullName,
        email: mentor.email,
        password: mentor.password,
        phoneNumber: mentor.phoneNumber,
        role: "mentor",
        isVerified: mentor.isVerified ?? false,
      };
    } catch (error: any) {
      logger.error(`Error finding mentor by email: ${email} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async markUserVerified(email: string): Promise<void> {
    try {
      const result = await MentorModel.updateOne({ email }, { $set: { isVerified: true } });
      if (result.matchedCount === 0) {
        logger.warn(`Mentor not found for verification: ${email}`);
        throw { statusCode: HttpStatusCode.NOT_FOUND, message: `Mentor with email ${email} not found` };
      }
      logger.info(`Mentor verified successfully: ${email}`);
    } catch (error: any) {
      logger.error(`Error verifying mentor: ${email} - ${error.message}`);
      throw error;
    }
  }

  async findById(id: string): Promise<AuthUser | null> {
    try {
      const mentor = await MentorModel.findById(id).lean();
      if (!mentor) {
        logger.warn(`Mentor not found by ID: ${id}`);
        return null;
      }
      logger.info(`Mentor found by ID: ${id}`);
      return {
        _id: mentor._id.toString(),
        fullName: mentor.fullName,
        email: mentor.email,
        password: mentor.password,
        phoneNumber: mentor.phoneNumber,
        role: "mentor",
        isVerified: mentor.isVerified ?? false,
      };
    } catch (error: any) {
      logger.error(`Error finding mentor by ID: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async comparePasswords(user: AuthUser, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error: any) {
      logger.error(`Error comparing passwords for user: ${user.email} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null> {
    try {
      const updatedMentor = await MentorModel.findByIdAndUpdate(id, data, { new: true }).lean();
      if (updatedMentor) logger.info(`Mentor profile updated: ${id}`);
      else logger.warn(`Mentor profile update failed: ${id}`);
      return updatedMentor || null;
    } catch (error: any) {
      logger.error(`Error updating mentor profile: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async updateVerificationStatus(id: string, isVerified: boolean, reason?: string): Promise<MentorProfile | null> {
    try {
      const update: Partial<MentorProfile> = { isVerified };
      if (reason) (update as any).rejectionReason = reason;

      const updatedMentor = await MentorModel.findByIdAndUpdate(id, update, { new: true }).lean();
      if (updatedMentor) logger.info(`Mentor verification status updated: ${id}, verified=${isVerified}`);
      else logger.warn(`Mentor verification update failed: ${id}`);
      return updatedMentor || null;
    } catch (error: any) {
      logger.error(`Error updating verification status for mentor: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async createUser(data: AuthUser | RegisterUserDto): Promise<AuthUser> {
    try {
      const { role, ...dataWithoutRole } = data;
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
      };
    } catch (error: any) {
      logger.error(`Error creating mentor: ${data.email} - ${error.message}`);
      throw { statusCode: HttpStatusCode.BAD_REQUEST, message: error.message };
    }
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    try {
      const result = await MentorModel.updateOne({ email }, { password: hashedPassword });
      if (result.matchedCount === 0) {
        logger.warn(`Mentor password update failed, email not found: ${email}`);
        throw { statusCode: HttpStatusCode.NOT_FOUND, message: "Mentor not found" };
      }
      logger.info(`Mentor password updated: ${email}`);
    } catch (error: any) {
      logger.error(`Error updating password for mentor: ${email} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async block(id: string): Promise<boolean> {
    try {
      const result = await MentorModel.findByIdAndUpdate(id, { isBlocked: true });
      if (result) logger.info(`Mentor blocked: ${id}`);
      else logger.warn(`Mentor block failed, ID not found: ${id}`);
      return result !== null;
    } catch (error: any) {
      logger.error(`Error blocking mentor: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
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
    } catch (error: any) {
      logger.error(`Error listing mentors - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }
}
