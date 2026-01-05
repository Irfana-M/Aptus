import type { IBooking } from "../models/booking.interface";
import type { ITimeSlot } from "../models/timeSlot.interface";

export interface ISchedulingService {
  /**
   * Generates time slot instances based on mentor recurring availability
   * @param projectionDays Number of days into the future to generate slots for
   */
  generateSlots(projectionDays: number): Promise<void>;

  /**
   * Performs an atomic booking for a student
   * @param studentId ID of the student
   * @param slotId ID of the time slot
   * @param studentSubjectId ID of the student-subject bridge
   */
  bookSlot(studentId: string, slotId: string, studentSubjectId: string): Promise<IBooking>;

  /**
   * Cancels a booking and frees up the slot capacity
   * @param bookingId ID of the booking to cancel
   * @param reason Reason for cancellation
   */
  cancelBooking(bookingId: string, reason?: string): Promise<void>;

  /**
   * Handles mentor leave by cancelling or reassigning affected slots
   * @param mentorId ID of the mentor
   * @param startDate Start date of the leave
   * @param endDate End date of the leave
   */
  handleMentorLeave(mentorId: string, startDate: Date, endDate: Date): Promise<void>;

  /**
   * Retrieves available slots based on filters
   * @param filters Filtering criteria (grade, subject, etc.)
   */
  getAvailableSlots(filters: any): Promise<ITimeSlot[]>;
}
