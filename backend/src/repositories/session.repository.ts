
import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository.js";
import type { ISession } from "../interfaces/models/session.interface.js";
import { SessionModel } from "../models/scheduling/session.model.js";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository.js";
import type { FilterQuery } from "mongoose";

@injectable()
export class SessionRepository extends BaseRepository<ISession> implements ISessionRepository {
  constructor() {
    super(SessionModel);
  }

  async findUpcomingByStudent(studentId: string, pagination?: { skip: number; limit: number }): Promise<ISession[]> {
    const query = this.model.find({
      $or: [
        { studentId: studentId },
        { 'participants.studentId': studentId },
        { 'participants.userId': studentId }
      ],
      status: { $in: ['scheduled', 'in_progress', 'rescheduling'] },
      endTime: { $gte: new Date() }
    })
    .sort({ startTime: 1 })
    .populate('subjectId')
    .populate('mentorId', 'fullName profilePicture');

    if (pagination) {
      query.skip(pagination.skip).limit(pagination.limit);
    }
    return query.exec();
  }

  async countUpcomingByStudent(studentId: string): Promise<number> {
    return this.model.countDocuments({
      $or: [
        { studentId: studentId },
        { 'participants.studentId': studentId },
        { 'participants.userId': studentId }
      ],
      status: { $in: ['scheduled', 'in_progress', 'rescheduling'] },
      endTime: { $gte: new Date() }
    }).exec();
  }

  async findUpcomingByMentor(mentorId: string, pagination?: { skip: number; limit: number }): Promise<ISession[]> {
    const query = this.model.find({
      mentorId: mentorId,
      status: { $in: ['scheduled', 'in_progress'] },
      endTime: { $gte: new Date() }
    })
    .sort({ startTime: 1 })
    .populate('subjectId')
    .populate('studentId', 'fullName profileImage')
    .populate('participants.userId', 'fullName profileImage');

    if (pagination) {
      query.skip(pagination.skip).limit(pagination.limit);
    }
    return query.exec();
  }

  async countUpcomingByMentor(mentorId: string): Promise<number> {
    return this.model.countDocuments({
      mentorId: mentorId,
      status: { $in: ['scheduled', 'in_progress'] },
      endTime: { $gte: new Date() }
    }).exec();
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

  async findByTimeSlot(timeSlotId: string): Promise<ISession | null> {
    return this.model.findOne({ timeSlotId }).exec();
  }

  async updateStatus(id: string, status: string): Promise<ISession | null> {
    return this.model.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).exec();
  }

  async deleteMany(filter: FilterQuery<ISession>): Promise<void> {
    await this.model.deleteMany(filter).exec();
  }

  async findTodayByMentor(mentorId: string, date: Date): Promise<ISession[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.model.find({
      mentorId,
      startTime: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' }
    }).exec();
  }

  async existsByTimeSlot(timeSlotId: string): Promise<ISession | null> {
    return this.model.findOne({ timeSlotId }).exec();
  }
}
