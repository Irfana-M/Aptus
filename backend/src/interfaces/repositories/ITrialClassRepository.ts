import type { ITrialClassDocument } from "@/models/student/trialClass.model.js";
import type { IBaseRepository } from "./IBaseRepository.js";
import type { FilterQuery } from "mongoose";

export interface ITrialClassRepository extends IBaseRepository<ITrialClassDocument> {
  createTrialRequest(trialClass: {
    student: string;
    subject: string;
    preferredDate: Date;
    preferredTime: string;
    status?: "requested" | "assigned" | "completed" | "cancelled";
  }): Promise<ITrialClassDocument>;

  findByStudentId(studentId: string, status?: string, skip?: number, limit?: number): Promise<ITrialClassDocument[]>;
  countByStudentId(studentId: string, status?: string): Promise<number>;

  findByMentorId(mentorId: string, skip?: number, limit?: number): Promise<ITrialClassDocument[]>;
  countByMentorId(mentorId: string): Promise<number>;

  findTodayTrialClasses(mentorId: string): Promise<ITrialClassDocument[]>;

  findAllPaginated(filters: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ trialClasses: ITrialClassDocument[]; total: number }>;

  findByStatus(
    status: string,
    page?: number,
    limit?: number
  ): Promise<{ trialClasses: ITrialClassDocument[]; total: number }>;

  assignMentor(
    trialClassId: string,
    mentorId: string,
    updates: Partial<ITrialClassDocument>
  ): Promise<ITrialClassDocument | null>;

  updateStatus(
    trialClassId: string,
    status: string,
    reason?: string
  ): Promise<ITrialClassDocument | null>;

  updateTrial(id: string, updates: Partial<ITrialClassDocument>): Promise<ITrialClassDocument | null>;

  getStudentTrialStats(studentId: string): Promise<{ total: number; pending: number }>;
  
  findCompletedByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ITrialClassDocument[]>;
  
  aggregate(pipeline: unknown[]): Promise<unknown[]>;
  countDocuments(filter: FilterQuery<ITrialClassDocument>): Promise<number>;
}