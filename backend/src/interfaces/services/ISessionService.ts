import type { ISession } from '../models/session.interface.js';
import type { LeaveEligibilityResponse } from './ILeaveEligibilityService.js';

export interface CreateSessionDto {
  mentorId: string;
  timeSlotId: string;
  studentId: string;
  courseId: string;
  enrollmentId: string;
  subjectId: string;
  startTime: Date;
  endTime: Date;
  sessionType: 'group' | 'one-to-one';
}

export interface ISessionService {
  getStudentUpcomingSessions(studentId: string): Promise<ISession[]>;
  getStudentUpcomingSessionsWithEligibility(studentId: string): Promise<LeaveEligibilityResponse>;
  getMentorUpcomingSessions(mentorId: string): Promise<ISession[]>;
  getMentorTodaySessions(mentorId: string): Promise<ISession[]>;
  createSession(data: Partial<ISession>): Promise<ISession>;
  getSessionById(sessionId: string): Promise<ISession | null>;
  updateSessionStatus(sessionId: string, status: string): Promise<ISession | null>;
  findByStudentAndSubject(studentId: string, subjectId: string): Promise<ISession[]>;
  updateStatus(id: string, status: string): Promise<ISession | null>;
  syncSessionsFromSlots(slots: Array<{ _id: string; mentorId: string; startTime: Date; endTime: Date }>): Promise<void>;
  reportAbsence(sessionId: string, studentId: string, reason: string): Promise<void>;
  cancelSession(sessionId: string, mentorId: string, reason: string): Promise<void>;
  resolveRescheduling(sessionId: string, studentId: string, newTimeSlotId?: string, slotDetails?: { date: string, startTime: string, endTime: string }): Promise<void>;
  completeSession(sessionId: string, mentorId: string): Promise<ISession | null>;
  activateJoinLinksForTimeWindow(from: Date, to: Date): Promise<void>;
}
