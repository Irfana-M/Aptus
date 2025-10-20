import { MentorModel } from "../models/mentor.model.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { MentorProfile } from "../interfaces/models/mentor.interface.js";
import { logger } from "../utils/logger.js";
import { HttpStatusCode } from "../constants/httpStatus.js";

export class MentorRepository implements IMentorRepository {

  async findById(id: string): Promise<MentorProfile | null> {
    try {
      const mentor = await MentorModel.findById(id).lean().exec();
      if (!mentor) {
        logger.warn(`Mentor not found by ID: ${id}`);
        return null;
      }
      logger.info(`Mentor found by ID: ${id}`);
      return mentor;
    } catch (error: any) {
      logger.error(`Error finding mentor by ID: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null> {
    try {
      const updatedMentor = await MentorModel.findByIdAndUpdate(id, data, { new: true }).lean().exec();
      if (!updatedMentor) {
        logger.warn(`Mentor profile update failed, ID not found: ${id}`);
        return null;
      }
      logger.info(`Mentor profile updated: ${id}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(`Error updating mentor profile: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async submitForApproval(id: string): Promise<MentorProfile> {
    try {
      const updatedMentor = await MentorModel.findByIdAndUpdate(
        id,
        { approvalStatus: "pending", submittedForApprovalAt: new Date() },
        { new: true }
      ).lean().exec();
      if (!updatedMentor) {
        logger.warn(`Mentor submit for approval failed, ID not found: ${id}`);
        throw { statusCode: HttpStatusCode.NOT_FOUND, message: `Mentor with ID ${id} not found` };
      }
      logger.info(`Mentor submitted for approval: ${id}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(`Error submitting mentor for approval: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async getPendingApprovals(): Promise<MentorProfile[]> {
    try {
      const mentors = await MentorModel.find({ approvalStatus: "pending" }).lean().exec();
      logger.info(`Fetched pending mentor approvals, count=${mentors.length}`);
      return mentors;
    } catch (error: any) {
      logger.error(`Error fetching pending approvals - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  async updateApprovalStatus(
    id: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<MentorProfile | null> {
    try {
      const update: any = { approvalStatus: status };
      if (status === "rejected") update.rejectionReason = rejectionReason || "";
      if (status === "approved") update.rejectionReason = undefined;

      const updatedMentor = await MentorModel.findByIdAndUpdate(id, update, { new: true }).lean().exec();
      if (!updatedMentor) {
        logger.warn(`Mentor approval status update failed, ID not found: ${id}`);
        throw { statusCode: HttpStatusCode.NOT_FOUND, message: `Mentor with ID ${id} not found` };
      }

      logger.info(`Mentor approval status updated: ${id}, status=${status}`);
      return updatedMentor;
    } catch (error: any) {
      logger.error(`Error updating approval status for mentor: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }
}
