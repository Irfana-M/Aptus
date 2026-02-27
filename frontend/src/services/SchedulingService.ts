import { schedulingRepository } from '../repositories/SchedulingRepository';
import { TimeSlot } from '../models/scheduling/TimeSlot';
import { Booking } from '../models/scheduling/Booking';
import type { AttendanceSummaryDto } from '../types/schedulingTypes';

export class SchedulingService {
  async getAvailableSlots(subjectId: string, date?: string): Promise<TimeSlot[]> {
    const dtos = await schedulingRepository.getAvailableSlots(subjectId, date);
    return dtos.map(dto => new TimeSlot(dto));
  }

  async bookSession(slotId: string, studentSubjectId: string): Promise<Booking> {
    const dto = await schedulingRepository.bookSlot(slotId, studentSubjectId);
    return new Booking(dto);
  }

  async getUpcomingSessions(): Promise<Booking[]> {
    const dtos = await schedulingRepository.getUpcomingSessions();
    return dtos.map(dto => new Booking(dto));
  }

  async cancelSession(bookingId: string): Promise<void> {
    await schedulingRepository.cancelBooking(bookingId);
  }

  async getAttendanceStats(): Promise<AttendanceSummaryDto> {
    return await schedulingRepository.getAttendanceSummary();
  }
}

export const schedulingService = new SchedulingService();
