import type { IAdmin } from "../models/admin.interface.js";
import type { MentorProfile } from "../models/mentor.interface.js";
export interface IAdminService {
  login(email: string, password: string): Promise<{
    admin: IAdmin;
    accessToken: string;
    refreshToken: string;
  }>;

   getDashboardData(): Promise<{
    totalStudents: number;
    totalMentors: number;
    recentStudents: any[];
    recentMentors: any[];
  }>;

  fetchMentorProfile(mentorId: string): Promise<MentorProfile | null>;

  updateMentorApprovalStatus(
    mentorId: string,
    status: "approved" | "rejected",
    adminId: string,
    reason?: string
  ): Promise<MentorProfile | null>;
}
