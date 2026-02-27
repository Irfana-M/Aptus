export interface ILeaveManagementService {
  handleMentorLeave(mentorId: string, startDate: Date, endDate: Date): Promise<void>;
}
