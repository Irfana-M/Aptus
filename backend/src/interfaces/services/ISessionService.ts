
import { ISession } from '../models/session.interface';

export interface ISessionService {
  getStudentUpcomingSessions(studentId: string): Promise<ISession[]>;
  getMentorUpcomingSessions(mentorId: string): Promise<ISession[]>;
  getMentorTodaySessions(mentorId: string): Promise<ISession[]>;
  createSession(data: any): Promise<ISession>;
}
