import type { IAdmin } from "../models/admin.interface.js";
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
}
