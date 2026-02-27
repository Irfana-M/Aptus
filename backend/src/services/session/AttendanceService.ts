import { injectable, inject } from "inversify";
import { TYPES } from "../../types";
import { logger } from "../../utils/logger";
import { AppError } from "../../utils/AppError";
import { HttpStatusCode } from "../../constants/httpStatus";
import type { IAttendanceService } from "../../interfaces/services/IAttendanceService";
import type { ISessionRepository } from "../../interfaces/repositories/ISessionRepository";
import type { IAttendanceRepository } from "../../interfaces/repositories/IAttendanceRepository";
import type { IAttendance } from "../../interfaces/models/attendance.interface";
import { SessionStatus } from "../../domain/session/constants";
import type { SessionAttendancePolicy } from "../../domain/policy/SessionAttendancePolicy";
import { Types } from "mongoose";

@injectable()
export class AttendanceService implements IAttendanceService {
  constructor(
    @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
    @inject(TYPES.IAttendanceRepository) private _attendanceRepo: IAttendanceRepository,
    @inject(TYPES.SessionAttendancePolicy) private _policy: SessionAttendancePolicy
  ) {}

  async markPresent(sessionId: string, userId: string, sessionModel: 'Session' | 'TrialClass'): Promise<IAttendance> {
    logger.info(`Marking user ${userId} present for ${sessionModel} ${sessionId}`);
    
    // Authorization/Validation: Use a generic way to check existence if possible, 
    // or just rely on the fact that we know what model it is.
    let session: any;
    if (sessionModel === 'Session') {
        session = await this._sessionRepo.findById(sessionId);
    } else {
        // Simple existence check for TrialClass (could be improved with a TrialRepo if needed, 
        // but for now we follow the user's logic)
        const { TrialClass } = await import("../../models/student/trialClass.model");
        session = await TrialClass.findById(sessionId);
    }

    if (!session) throw new AppError(`${sessionModel} not found`, HttpStatusCode.NOT_FOUND);

    // Apply policy (Policy expects IBooking, which both Session and TrialClass mostly satisfy)
    this._policy.canMarkPresent(session as unknown as import('../../interfaces/models/booking.interface').IBooking);

    let attendance = await this._attendanceRepo.findBySessionAndUser(sessionId, userId, sessionModel);
    if (attendance) {
      attendance = await this._attendanceRepo.updateById((attendance as unknown as { _id: { toString(): string } })._id.toString(), { 
        status: 'present',
        source: 'manual',
        isFinalized: true 
      });
    } else {
      attendance = await this._attendanceRepo.create({
        sessionId: new Types.ObjectId(sessionId) as unknown as import('mongoose').Schema.Types.ObjectId,
        sessionModel: sessionModel,
        userId: new Types.ObjectId(userId) as unknown as import('mongoose').Schema.Types.ObjectId,
        userRole: (session.mentorId?.toString() === userId || session.mentor?.toString() === userId) ? 'Mentor' : 'Student',
        status: 'present',
        source: 'manual',
        isFinalized: true
      });
    }
    
    // Update session status if it was scheduled (Only for regular sessions)
    if (sessionModel === 'Session' && (session.status === 'scheduled' || session.status === 'in_progress')) {
        await this._sessionRepo.updateStatus(sessionId, SessionStatus.COMPLETED);
    }
    
    return attendance;
  }

  async markAbsent(sessionId: string, userId: string, sessionModel: 'Session' | 'TrialClass', reason?: string): Promise<IAttendance> {
    logger.info(`Marking user ${userId} absent for ${sessionModel} ${sessionId}. Reason: ${reason}`);
    
    let session: any;
    if (sessionModel === 'Session') {
        session = await this._sessionRepo.findById(sessionId);
    } else {
        const { TrialClass } = await import("../../models/student/trialClass.model");
        session = await TrialClass.findById(sessionId);
    }
    if (!session) throw new AppError(`${sessionModel} not found`, HttpStatusCode.NOT_FOUND);

    this._policy.canMarkAbsent(session as unknown as import('../../interfaces/models/booking.interface').IBooking);

    let attendance = await this._attendanceRepo.findBySessionAndUser(sessionId, userId, sessionModel);
    if (attendance) {
      attendance = await this._attendanceRepo.updateById((attendance as unknown as { _id: { toString(): string } })._id.toString(), { 
        status: 'absent',
        source: 'manual',
        isFinalized: true
      });
    } else {
      attendance = await this._attendanceRepo.create({
        sessionId: new Types.ObjectId(sessionId) as unknown as import('mongoose').Schema.Types.ObjectId,
        sessionModel: sessionModel,
        userId: new Types.ObjectId(userId) as unknown as import('mongoose').Schema.Types.ObjectId,
        userRole: (session.mentorId?.toString() === userId || session.mentor?.toString() === userId) ? 'Mentor' : 'Student',
        status: 'absent',
        source: 'manual',
        isFinalized: true
      });
    }
    
    // For 1:1, if student is absent, session might be considered absent/cancelled (Only for Sessions)
    if (sessionModel === 'Session' && session.sessionType === 'one-to-one' && session.mentorId.toString() !== userId) {
        await this._sessionRepo.updateStatus(sessionId, SessionStatus.ABSENT);
    }

    return attendance;
  }

  async createAutomationAttendance(sessionId: string, studentId: string, mentorId: string): Promise<void> {
    logger.info(`Creating automated attendance for regular session ${sessionId}`);
    
    const participants = [
      { userId: studentId, role: 'Student' as const },
      { userId: mentorId, role: 'Mentor' as const }
    ];

    for (const p of participants) {
      let attendance = await this._attendanceRepo.findBySessionAndUser(sessionId, p.userId, 'Session');
      if (!attendance) {
        await this._attendanceRepo.create({
          sessionId: new Types.ObjectId(sessionId) as unknown as import('mongoose').Schema.Types.ObjectId,
          sessionModel: 'Session',
          userId: new Types.ObjectId(p.userId) as unknown as import('mongoose').Schema.Types.ObjectId,
          userRole: p.role,
          status: 'present',
          source: 'automated',
          isFinalized: true
        });
      } else if (!attendance.isFinalized) {
        await this._attendanceRepo.updateById((attendance as unknown as { _id: { toString(): string } })._id.toString(), {
          status: 'present',
          source: 'automated',
          isFinalized: true
        });
      }
    }
  }

  async createTrialDerivedAttendance(trialClassId: string, studentId: string, mentorId: string): Promise<void> {
    logger.info(`Creating trial-derived attendance for trial class ${trialClassId}`);
    
    const participants = [
      { userId: studentId, role: 'Student' as const },
      { userId: mentorId, role: 'Mentor' as const }
    ];

    for (const p of participants) {
      let attendance = await this._attendanceRepo.findBySessionAndUser(trialClassId, p.userId, 'TrialClass');
      if (!attendance) {
        await this._attendanceRepo.create({
          sessionId: new Types.ObjectId(trialClassId) as unknown as import('mongoose').Schema.Types.ObjectId,
          sessionModel: 'TrialClass',
          userId: new Types.ObjectId(p.userId) as unknown as import('mongoose').Schema.Types.ObjectId,
          userRole: p.role,
          status: 'present',
          source: 'trial_derived',
          isFinalized: true
        });
      }
    }
  }

  async getStudentHistory(studentId: string): Promise<IAttendance[]> {
    return this._attendanceRepo.findByUser(studentId);
  }

  async getMentorHistory(mentorId: string): Promise<IAttendance[]> {
    return this._attendanceRepo.findByUser(mentorId);
  }

  async getAllAttendance(): Promise<IAttendance[]> {
    return this._attendanceRepo.findAllWithDetails();
  }
}
