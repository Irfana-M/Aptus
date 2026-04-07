import type { IBooking } from "../models/booking.interface";
import type { ITimeSlot } from "../models/timeSlot.interface";

export interface ISchedulingService {

  generateSlots(projectionDays: number): Promise<void>;
  generateMentorSlots(mentorId: string, projectionDays: number): Promise<void>;

  bookSlot(studentId: string, slotId: string, studentSubjectId: string): Promise<IBooking>;

  cancelBooking(bookingId: string, initiator: 'student' | 'mentor' | 'admin', reason?: string): Promise<void>;

  processLeaveImpact(mentorId: string, startDate: Date, endDate: Date): Promise<void>;

  getAvailableSlots(filters: Record<string, unknown>): Promise<ITimeSlot[]>;
  ensureTimeSlot(mentorId: string, startTime: Date, endTime: Date): Promise<string>;
}
