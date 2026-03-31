import type { RegisterUserDto } from "@/dtos/auth/RegisteruserDTO.js";
import type { MentorProfile } from "../models/mentor.interface.js";
import type { MentorResponseDto } from "@/dtos/mentor/MentorResponseDTO.js";
import type { LeavePaginatedResult } from "../repositories/IMentorRepository.js";
import { LEAVE_STATUS } from "../../constants/status.constants.js";

export interface IMentorService {
  registerMentor(data: RegisterUserDto): Promise<unknown>;
  updateMentorProfile(mentorId: string, data: Partial<MentorProfile>): Promise<MentorProfile>;
  submitProfileForApproval(
    mentorId: string,
    requestingUserId: string
  ): Promise<{ message: string }>;
  getPendingMentors(): Promise<MentorProfile[]>;
  approveMentor(
    mentorId: string,
    adminId: string
  ): Promise<{ message: string }>;
  rejectMentor(
    mentorId: string,
    adminId: string,
    reason: string
  ): Promise<{ message: string }>;
  getMentorTrialClasses(mentorId: string, page?: number, limit?: number): Promise<{ items: any[]; total: number }>;
  getById(id: string): Promise<MentorResponseDto | null>;
  getMentorProfile(mentorId: string): Promise<MentorProfile | null>;
  normalizeMentorAvailability(mentorId: string): Promise<void>;
  getMentorAvailableSlots(mentorId: string): Promise<{
    day: string;
    date: string;
    slots: { _id?: string; startTime: string; endTime: string; remainingCapacity: number }[];
  }[]>;
  requestLeave(mentorId: string, startDate: Date, endDate: Date, reason?: string): Promise<void>;
  approveLeave(mentorId: string | undefined, leaveId: string, adminId: string): Promise<void>;
  rejectLeave(mentorId: string | undefined, leaveId: string, adminId: string, reason: string): Promise<void>;
  getMentorDailySessions(mentorId: string, date: Date): Promise<unknown[]>;
  getMentorUpcomingSessionsWithEligibility(mentorId: string): Promise<{ sessions: unknown[], leaveWindowOpen: boolean }>;
  getOneToOneStudents(mentorId: string): Promise<unknown[]>;
  getGroupBatches(mentorId: string): Promise<unknown[]>;
  getPaginatedLeaves(params: {
    page: number;
    limit: number;
    mentorId?: string;
    status?: LEAVE_STATUS | '';
  }): Promise<LeavePaginatedResult>;
}
