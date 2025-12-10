import type { AssignedStudentsResponseDto, DashboardDataDto, RecentActivityDto, TodaySessionDto } from "../models/mentorDashboard.interface";

export interface IMentorDashboardService {
  getDashboardData(mentorId: string): Promise<DashboardDataDto>;
  getAssignedStudents(mentorId: string, page: number, limit: number): Promise<AssignedStudentsResponseDto>;
  getTodaySessions(mentorId: string): Promise<TodaySessionDto[]>;
  getRecentActivities(mentorId: string, limit?: number): Promise<RecentActivityDto[]>;
}