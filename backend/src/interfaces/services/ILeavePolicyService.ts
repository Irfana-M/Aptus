export interface ILeavePolicyService {
    validateLeaveRequest(mentorId: string, startDate: Date, endDate: Date): Promise<void>;
    isWithinCutoff(sessionStartTime: Date): boolean;
}
