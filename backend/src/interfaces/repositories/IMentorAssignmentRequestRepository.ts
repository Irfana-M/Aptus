import { type IMentorAssignmentRequest } from "../../models/mentorAssignmentRequest.model";
import mongoose from "mongoose";

export interface IMentorAssignmentRequestRepository {
  create(data: Partial<IMentorAssignmentRequest>, session?: mongoose.ClientSession): Promise<IMentorAssignmentRequest>;
  findOne(filter: Partial<IMentorAssignmentRequest>, session?: mongoose.ClientSession): Promise<IMentorAssignmentRequest | null>;
  findById(id: string, session?: mongoose.ClientSession): Promise<IMentorAssignmentRequest | null>;
  findPending(): Promise<IMentorAssignmentRequest[]>;
  findByStudent(studentId: string): Promise<IMentorAssignmentRequest[]>;
  updateStatus(id: string, status: 'approved' | 'rejected', adminId: string, reason?: string, session?: mongoose.ClientSession): Promise<IMentorAssignmentRequest | null>;
}
