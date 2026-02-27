import type { RegisterUserDto } from "@/dtos/auth/RegisteruserDTO";
import type { MentorProfile } from "../models/mentor.interface";
import type { MentorResponseDto } from "@/dtos/mentor/MentorResponseDTO";

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
  getMentorTrialClasses(mentorId: string): Promise<unknown[]>;
  getById(id: string): Promise<MentorResponseDto | null>;
  getMentorProfile(mentorId: string): Promise<MentorProfile | null>;
  normalizeMentorAvailability(mentorId: string): Promise<void>;
  getMentorAvailableSlots(mentorId: string): Promise<{
    day: string;
    slots: { startTime: string; endTime: string; remainingCapacity: number }[];
  }[]>;
  requestLeave(mentorId: string, startDate: Date, endDate: Date, reason?: string): Promise<void>;
  approveLeave(mentorId: string, leaveId: string, adminId: string): Promise<void>;
  getMentorDailySessions(mentorId: string, date: Date): Promise<unknown[]>;
  getOneToOneStudents(mentorId: string): Promise<unknown[]>;
  getGroupBatches(mentorId: string): Promise<unknown[]>;
}
