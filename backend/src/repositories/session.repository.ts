
import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import type { ISession } from "../interfaces/models/session.interface";
import { SessionModel } from "../models/scheduling/session.model";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository";

@injectable()
export class SessionRepository extends BaseRepository<ISession> implements ISessionRepository {
  constructor() {
    super(SessionModel);
  }

  async findUpcomingByStudent(studentId: string): Promise<ISession[]> {
    return this.model.find({
      $or: [
        { studentId: studentId },
        { 'participants.studentId': studentId },
        { 'participants.userId': studentId }
      ],
      status: 'scheduled',
      startTime: { $gte: new Date() }
    })
    .sort({ startTime: 1 })
    .populate('subjectId')
    .populate('mentorId', 'fullName profilePicture')
    .exec();
  }

  async findUpcomingByMentor(mentorId: string): Promise<ISession[]> {
    return this.model.find({
      mentorId: mentorId,
      status: 'scheduled',
      startTime: { $gte: new Date() }
    })
    .sort({ startTime: 1 })
    .populate('subjectId')
    .populate('studentId', 'fullName profileImage')
    .populate('participants.userId', 'fullName profileImage')
    .exec();
  }

  async findByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ISession[]> {
    return this.model.find({
      mentorId: mentorId,
      startTime: { $gte: startDate, $lt: endDate },
      status: { $ne: 'cancelled' }
    })
    .sort({ startTime: 1 })
    .populate('subjectId')
    .populate('studentId', 'fullName profileImage')
    .populate('participants.userId', 'fullName profileImage')
    .exec();
  }
  
  async findByStudentAndSubject(studentId: string, subjectId: string): Promise<ISession[]> {
    return this.model.find({
      $or: [
        { studentId: studentId },
        { 'participants.studentId': studentId },
        { 'participants.userId': studentId }
      ],
      subjectId: subjectId,
      status: { $ne: 'cancelled' }
    })
    .sort({ startTime: 1 })
    .exec();
  }
}
