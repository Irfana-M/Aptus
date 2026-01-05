import { injectable } from "inversify";
import { MentorAssignmentRequest, type IMentorAssignmentRequest } from "../models/mentorAssignmentRequest.model";
import { type IMentorAssignmentRequestRepository } from "../interfaces/repositories/IMentorAssignmentRequestRepository";
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import { logger } from "@/utils/logger";
import mongoose from "mongoose";

@injectable()
export class MentorAssignmentRequestRepository implements IMentorAssignmentRequestRepository {
  async create(data: Partial<IMentorAssignmentRequest>, session?: mongoose.ClientSession): Promise<IMentorAssignmentRequest> {
    try {
      const [request] = await MentorAssignmentRequest.create([data], { session });
      if (!request) throw new AppError("Failed to create request", HttpStatusCode.INTERNAL_SERVER_ERROR);
      return request;
    } catch (error) {
      logger.error("Error creating mentor assignment request:", error);
      throw new AppError("Failed to create mentor request", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(filter: Partial<IMentorAssignmentRequest>, session?: mongoose.ClientSession): Promise<IMentorAssignmentRequest | null> {
    try {
      const query = MentorAssignmentRequest.findOne(filter as any);
      if (session) query.session(session);
      return await query.exec();
    } catch (error) {
      logger.error("Error finding mentor assignment request:", error);
      throw new AppError("Failed to find mentor request", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findById(id: string, session?: mongoose.ClientSession): Promise<IMentorAssignmentRequest | null> {
    try {
      const query = MentorAssignmentRequest.findById(id)
        .populate('studentId', 'fullName email')
        .populate('mentorId', 'fullName profileImageUrl')
        .populate('subjectId', 'subjectName');
      
      if (session) query.session(session);
      return await query.exec();
    } catch (error) {
      logger.error(`Error finding mentor assignment request by ID ${id}:`, error);
      throw new AppError("Failed to find mentor request", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async findPending(): Promise<IMentorAssignmentRequest[]> {
     try {
      return await MentorAssignmentRequest.find({ status: 'pending' })
        .populate('studentId', 'fullName email')
        .populate('mentorId', 'fullName profileImageUrl')
        .populate('subjectId', 'subjectName')
        .sort({ requestedAt: -1 })
        .lean()
        .exec();
    } catch (error) {
      logger.error("Error finding pending mentor requests:", error);
      throw new AppError("Failed to fetch pending requests", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
  
  async findByStudent(studentId: string): Promise<IMentorAssignmentRequest[]> {
    try {
      return await MentorAssignmentRequest.find({ studentId })
        .populate('mentorId', 'fullName profileImageUrl')
        .populate('subjectId', 'subjectName')
        .sort({ requestedAt: -1 })
        .lean()
        .exec();
    } catch (error) {
      logger.error(`Error finding requests for student ${studentId}:`, error);
      throw new AppError("Failed to fetch student requests", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateStatus(id: string, status: 'approved' | 'rejected', adminId: string, reason?: string): Promise<IMentorAssignmentRequest | null> {
    try {
        const updateData: any = {
            status,
            processedAt: new Date(),
            processedBy: new mongoose.Types.ObjectId(adminId)
        };
        
        if (reason) updateData.rejectionReason = reason;

        const result = await MentorAssignmentRequest.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).exec();
        
        return result;
    } catch (error) {
        logger.error(`Error updating status for request ${id}:`, error);
        throw new AppError("Failed to update request status", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}
