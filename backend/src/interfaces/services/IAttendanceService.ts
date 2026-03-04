import type { IAttendance } from "../models/attendance.interface.js";

export interface IAttendanceService {
  markPresent(sessionId: string, userId: string, sessionModel: 'Session' | 'TrialClass'): Promise<IAttendance>;
  markAbsent(sessionId: string, userId: string, sessionModel: 'Session' | 'TrialClass', reason?: string): Promise<IAttendance>;
  getStudentHistory(studentId: string): Promise<IAttendance[]>;
  getMentorHistory(mentorId: string): Promise<IAttendance[]>;
  getAllAttendance(): Promise<IAttendance[]>;
  createAutomationAttendance(sessionId: string, studentId: string, mentorId: string): Promise<void>;
  createTrialDerivedAttendance(trialClassId: string, studentId: string, mentorId: string): Promise<void>;
}
