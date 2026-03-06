import api from '../api/api';
import type { TimeSlotDto, BookingDto, AttendanceSummaryDto } from '../types/scheduling.types';

export class SchedulingRepository {
  // Slots
  async getAvailableSlots(subjectId: string, date?: string): Promise<TimeSlotDto[]> {
    const params = { subjectId, date };
    const response = await api.get<TimeSlotDto[]>('/scheduling/slots', { params });
    return response.data;
  }

  // Bookings
  async bookSlot(slotId: string, studentSubjectId: string): Promise<BookingDto> {
    const response = await api.post<BookingDto>('/scheduling/book', { slotId, studentSubjectId });
    return response.data;
  }

  async getUpcomingSessions(): Promise<BookingDto[]> {
    const response = await api.get<BookingDto[]>('/scheduling/upcoming');
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await api.post(`/scheduling/cancel/${bookingId}`);
  }

  // Attendance
  async getAttendanceSummary(): Promise<AttendanceSummaryDto> {
    const response = await api.get<AttendanceSummaryDto>('/scheduling/attendance/summary');
    return response.data;
  }
}

export const schedulingRepository = new SchedulingRepository();

