import type { IAttendance } from "../models/attendance.interface";
import type { IBaseRepository } from "./IBaseRepository";

export interface IAttendanceRepository extends IBaseRepository<IAttendance> {
  findBySession(sessionId: string): Promise<IAttendance[]>;
  findByUser(userId: string): Promise<IAttendance[]>;
  findBySessionAndUser(sessionId: string, userId: string, sessionModel: 'Session' | 'TrialClass'): Promise<IAttendance | null>;
  markFinalized(sessionId: string): Promise<void>;
  findAllWithDetails(): Promise<IAttendance[]>;
}
