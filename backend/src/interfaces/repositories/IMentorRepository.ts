import type { MentorProfile, LeaveEntry } from "../models/mentor.interface";
import type { IBaseRepository } from "./IBaseRepository";
import type { MentorPaginationParams } from "@/dtos/shared/paginationTypes";
import type { ClientSession } from "mongoose";

export interface MentorPaginatedResult {
  mentors: MentorProfile[];
  total: number;
}

export interface LeavePaginatedResult {
  items: (LeaveEntry & { _id: string; mentorId: string; mentorName: string })[];
  total: number;
}

import { LEAVE_STATUS } from "../../constants/status.constants";

export interface IMentorRepository extends IBaseRepository<MentorProfile> {
  getPaginatedLeaves(params: {
    page: number;
    limit: number;
    mentorId?: string;
    status?: LEAVE_STATUS | '';
  }): Promise<LeavePaginatedResult>;
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
    date?: string;
    excludeCourseId?: string;
  }): Promise<unknown[]>;
  incrementWeeklyBookings(id: string): Promise<void>;
  decrementWeeklyBookings(id: string): Promise<void>;
  findByLeaveId(leaveId: string): Promise<MentorProfile | null>;
  addLeave(id: string, leave: { startDate: Date; endDate: Date; reason?: string; approved: boolean; status: LEAVE_STATUS }): Promise<void>;
  updateLeaveStatus(mentorId: string, leaveId: string, data: Partial<LeaveEntry>, session?: ClientSession): Promise<void>;
}
