import type { ITrialClassDocument } from "@/models/student/trialClass.model";

export interface ITrialClassRepository {
  create(trialClass: {
    student: string;
    subject: string;
    preferredDate: Date;
    preferredTime: string;
    status?: "requested" | "assigned" | "completed" | "cancelled";
  }): Promise<ITrialClassDocument>;

  findById(id: string): Promise<ITrialClassDocument | null>;

  update(
    id: string,
    updates: Partial<ITrialClassDocument>
  ): Promise<ITrialClassDocument | null>;

  delete(id: string): Promise<boolean>;

  findByStudentId(studentId: string, status?: string): Promise<ITrialClassDocument[]>;

  findByMentorId(mentorId: string): Promise<ITrialClassDocument[]>;

  // THIS LINE WAS MISSING IN THE REAL INTERFACE FILE
  findTodayTrialClasses(mentorId: string): Promise<ITrialClassDocument[]>;

  findAll(filters: {
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

  getStudentTrialStats(studentId: string): Promise<{ total: number; pending: number }>;
}