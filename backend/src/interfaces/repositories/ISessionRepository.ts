
import type { ISession } from "../models/session.interface";
import type { IBaseRepository } from './IBaseRepository';

export interface ISessionRepository extends IBaseRepository<ISession> {
  findUpcomingByStudent(studentId: string): Promise<ISession[]>;
  findUpcomingByMentor(mentorId: string): Promise<ISession[]>;
  findByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ISession[]>;
  findByStudentAndSubject(studentId: string, subjectId: string): Promise<ISession[]>;
  findByTimeSlot(timeSlotId: string): Promise<ISession | null>;
  updateStatus(id: string, status: string): Promise<ISession | null>;
  deleteMany(filter: Record<string, unknown>): Promise<void>;
  findTodayByMentor(mentorId: string, date: Date): Promise<ISession[]>;
  existsByTimeSlot(timeSlotId: string): Promise<ISession | null>;
}
