
import type { ISession } from '../models/session.interface';
import type { IBaseRepository } from './IBaseRepository';

export interface ISessionRepository extends IBaseRepository<ISession> {
  findUpcomingByStudent(studentId: string): Promise<ISession[]>;
  findUpcomingByMentor(mentorId: string): Promise<ISession[]>;
  findByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ISession[]>;
  findByStudentAndSubject(studentId: string, subjectId: string): Promise<ISession[]>;
}
