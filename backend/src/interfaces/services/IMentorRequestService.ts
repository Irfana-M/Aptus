import type { IMentorAssignmentRequest } from "../../models/mentorAssignmentRequest.model.js";

export interface IMentorRequestService {
  getPendingRequests(): Promise<IMentorAssignmentRequest[]>;
  getRequestsByStudent(studentId: string): Promise<IMentorAssignmentRequest[]>;
  approveRequest(
    requestId: string,
    adminId: string,
    overrides?: {
      mentorId?: string;
      days?: string[];
      timeSlot?: string;
    }
  ): Promise<{ 
    courseId: string, 
    isFreshApproval: boolean,
    recoveredRecords: string[]
  }>;
  rejectRequest(
    requestId: string,
    adminId: string,
    reason?: string
  ): Promise<void>;
  
  generateSessionsForWeeks(
    studentId: string,
    mentorId: string,
    subjectId: string,
    courseId: string,
    enrollmentId: string,
    slots: { day: string; startTime: string; endTime: string }[],
    weeks: number,
    courseType?: 'one-to-one' | 'group'
  ): Promise<void>;
}
