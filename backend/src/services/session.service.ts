
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { ISessionService } from "../interfaces/services/ISessionService";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository";
import type { ISession } from "../interfaces/models/session.interface";

@injectable()
export class SessionService implements ISessionService {
  constructor(
    @inject(TYPES.ISessionRepository) private sessionRepo: ISessionRepository
  ) {}

  async getStudentUpcomingSessions(studentId: string): Promise<ISession[]> {
    return this.sessionRepo.findUpcomingByStudent(studentId);
  }

  async getMentorUpcomingSessions(mentorId: string): Promise<ISession[]> {
    return this.sessionRepo.findUpcomingByMentor(mentorId);
  }

  async getMentorTodaySessions(mentorId: string): Promise<ISession[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Assuming repo supports finding by range or we filter logic here. Keep it simple in repo if possible.
    // Ideally repo.findBetween(mentorId, start, end).
    return this.sessionRepo.findByMentorAndDateRange(mentorId, today, tomorrow);
  }

  async createSession(data: any): Promise<ISession> {
    return this.sessionRepo.create(data);
  }
}
