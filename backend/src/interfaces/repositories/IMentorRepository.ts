import type { MentorProfile } from "../models/mentor.interface";
import type { IBaseRepository } from "./IBaseRepository";
import type { MentorPaginationParams } from "@/dtos/shared/paginationTypes";
import type { ClientSession } from "mongoose";

export interface MentorPaginatedResult {
  mentors: MentorProfile[];
  total: number;
}

export interface IMentorRepository extends IBaseRepository<MentorProfile> {
  findById(id: string, session?: ClientSession): Promise<MentorProfile | null>;
  getProfileWithImage(id: string): Promise<MentorProfile | null>;
  updateProfile(
    id: string,
    data: Partial<MentorProfile>,
    session?: ClientSession
  ): Promise<MentorProfile | null>;
  submitForApproval(id: string): Promise<MentorProfile>;
  getPendingApprovals(): Promise<MentorProfile[]>;
  updateApprovalStatus(
    id: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<MentorProfile | null>;
  getAllMentors(): Promise<MentorProfile[]>;
  findAllMentorsPaginated(params: MentorPaginationParams): Promise<MentorPaginatedResult>;
  findByEmail(email: string): Promise<MentorProfile | null>;
  findBySubjectProficiency(
    subjectName: string,
    date?: string
  ): Promise<MentorProfile[]>;
  findAvailableMentors(params: {
    gradeId: string;
    subjectId: string;
    days?: string[];
    timeSlot?: string;
    excludeCourseId?: string;
  }): Promise<unknown[]>;
  incrementWeeklyBookings(id: string): Promise<void>;
  decrementWeeklyBookings(id: string): Promise<void>;
  addLeave(id: string, leave: { startDate: Date; endDate: Date; reason?: string; approved: boolean }): Promise<void>;
  updateLeaveStatus(mentorId: string, leaveId: string, approved: boolean): Promise<void>;
}
