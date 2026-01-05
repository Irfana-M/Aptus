import type { IBooking } from "../../interfaces/models/booking.interface";

export interface IAttendanceService {
  markPresent(sessionId: string): Promise<IBooking>;
  markAbsent(sessionId: string, reason?: string): Promise<IBooking>;
}
