import { injectable } from "inversify";
import { logger } from "../utils/logger";
import { BaseRepository } from "./baseRepository";
import { AttendanceModel } from "../models/scheduling/attendance.model";
import type { IAttendance } from "../interfaces/models/attendance.interface";
import type { IAttendanceRepository } from "../interfaces/repositories/IAttendanceRepository";
import { SessionModel } from "../models/scheduling/session.model";
import { TrialClass } from "../models/student/trialClass.model";
import { Subject } from "../models/subject.model";
import { StudentModel } from "../models/student/student.model";
import { MentorModel } from "../models/mentor/mentor.model";

@injectable()
export class AttendanceRepository extends BaseRepository<IAttendance> implements IAttendanceRepository {
  constructor() {
    super(AttendanceModel);
  }

  async findBySession(sessionId: string): Promise<IAttendance[]> {
    return this.model.find({ sessionId }).exec();
  }

  async findByUser(userId: string): Promise<IAttendance[]> {
    const records = await this.model.find({ userId })
      .populate('userId', 'fullName email profilePicture profileImage')
      .populate({
        path: 'sessionId',
        strictPopulate: false,
        populate: [
          { path: 'subjectId', strictPopulate: false }, // For Session
          { path: 'subject', strictPopulate: false }    // For TrialClass
        ]
      })
      .sort({ createdAt: -1 })
      .exec();
    
    return this.normalizeRecords(records);
  }

  async findBySessionAndUser(sessionId: string, userId: string, sessionModel: 'Session' | 'TrialClass'): Promise<IAttendance | null> {
    return this.model.findOne({ sessionId, userId, sessionModel }).exec();
  }

  async markFinalized(sessionId: string): Promise<void> {
    await this.model.updateMany({ sessionId }, { isFinalized: true }).exec();
  }

  async findAllWithDetails(): Promise<IAttendance[]> {
    const records = await this.model.find()
      .populate('userId', 'fullName email profilePicture profileImage')
      .populate({
        path: 'sessionId',
        strictPopulate: false,
        populate: [
          { path: 'subjectId', strictPopulate: false }, // For Session
          { path: 'subject', strictPopulate: false }    // For TrialClass
        ]
      })
      .sort({ createdAt: -1 })
      .exec();
    
    return this.normalizeRecords(records);
  }

  private normalizeRecords(records: IAttendance[]): IAttendance[] {
    return records.map(record => {
      // Safely convert to object if it's a Mongoose document
      const recordObj = (record as any).toObject ? (record as any).toObject() : record;
      const sessionId = recordObj.sessionId;
      
      // Handle the case where sessionId might be an object (populated)
      if (sessionId && typeof sessionId === 'object') {
        if (!sessionId.subjectId && sessionId.subject) {
          // Normalize TrialClass to look like a Session for the frontend
          sessionId.subjectId = sessionId.subject;
          sessionId.sessionType = 'one-to-one';
        }
      }
      return recordObj;
    });
  }
}
