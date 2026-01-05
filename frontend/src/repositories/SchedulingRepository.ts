import userApi from '../api/userApi';
import { TimeSlotDto, BookingDto, AttendanceSummaryDto } from '../types/schedulingTypes';

export class SchedulingRepository {
  // Slots
  async getAvailableSlots(subjectId: string, date?: string): Promise<TimeSlotDto[]> {
    const params = { subjectId, date };
    const response = await userApi.get<TimeSlotDto[]>('/scheduling/slots', { params });
    return response.data;
  }

  // Bookings
  async bookSlot(slotId: string, studentSubjectId: string): Promise<BookingDto> {
    const response = await userApi.post<BookingDto>('/scheduling/book', { slotId, studentSubjectId });
    return response.data;
  }

  async getUpcomingSessions(): Promise<BookingDto[]> {
    const response = await userApi.get<BookingDto[]>('/scheduling/upcoming');
    return response.data;
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await userApi.post(`/scheduling/cancel/${bookingId}`);
  }

  // Attendance
  async getAttendanceSummary(): Promise<AttendanceSummaryDto> {
    const response = await userApi.get<AttendanceSummaryDto>('/scheduling/attendance/summary');
    return response.data;
  }
}

export const schedulingRepository = new SchedulingRepository();
