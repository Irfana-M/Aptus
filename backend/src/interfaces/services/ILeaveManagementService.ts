export interface ILeaveManagementService {
  processLeaveImpact(mentorId: string, startDate: Date, endDate: Date): Promise<void>;
}
