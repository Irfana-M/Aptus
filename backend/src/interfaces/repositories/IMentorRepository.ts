import type { MentorProfile } from "../models/mentor.interface";
import type { IBaseRepository } from "./IBaseRepository";


export interface IMentorRepository extends IBaseRepository<MentorProfile> {
  findById(id: string): Promise<MentorProfile | null>;
  updateProfile(
    id: string,
    data: Partial<MentorProfile>
  ): Promise<MentorProfile | null>;
  submitForApproval(id: string): Promise<MentorProfile>;
  getPendingApprovals(): Promise<MentorProfile[]>;
  updateApprovalStatus(
    id: string,
    status: "approved" | "rejected",
    rejectionReason?: string
  ): Promise<MentorProfile | null>;
  getAllMentors(): Promise<MentorProfile[]>;
  findByEmail(email: string): Promise<MentorProfile | null>;
  findBySubjectProficiency(subjectName: string, date?: string): Promise<MentorProfile[]>;
}
