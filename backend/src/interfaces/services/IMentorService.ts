import type { RegisterUserDto } from "@/dto/auth/RegisteruserDTO";
import type { MentorProfile } from "../models/mentor.interface";

export interface IMentorService {
  registerMentor(data: RegisterUserDto): Promise<any>;
  updateMentorProfile(mentorId: string, data: any): Promise<MentorProfile>;
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
}
