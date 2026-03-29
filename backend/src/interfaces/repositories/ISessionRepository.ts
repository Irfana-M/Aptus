
import type { ISession } from "../models/session.interface.js";
import type { IBaseRepository } from './IBaseRepository.js';

export interface ISessionRepository extends IBaseRepository<ISession> {
  findUpcomingByStudent(studentId: string, pagination?: { skip: number; limit: number }, filter?: { startDate?: Date | undefined; endDate?: Date | undefined }): Promise<ISession[]>;
  countUpcomingByStudent(studentId: string, filter?: { startDate?: Date | undefined; endDate?: Date | undefined }): Promise<number>;
  findUpcomingByMentor(mentorId: string, pagination?: { skip: number; limit: number }, filter?: { startDate?: Date | undefined; endDate?: Date | undefined }): Promise<ISession[]>;
  countUpcomingByMentor(mentorId: string, filter?: { startDate?: Date | undefined; endDate?: Date | undefined }): Promise<number>;
  findByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ISession[]>;
  findByStudentAndSubject(studentId: string, subjectId: string): Promise<ISession[]>;
  findByTimeSlot(timeSlotId: string): Promise<ISession | null>;
  updateStatus(id: string, status: string): Promise<ISession | null>;
  updateMany(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<void>;
  deleteMany(filter: Record<string, unknown>): Promise<void>;
  findTodayByMentor(mentorId: string, date: Date): Promise<ISession[]>;
  existsByTimeSlot(timeSlotId: string): Promise<ISession | null>;
}
