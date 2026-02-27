import type { ClientSession, FilterQuery } from 'mongoose';
import type { IBaseRepository } from './IBaseRepository';
import type { IBooking } from '../models/booking.interface';

export interface IBookingRepository extends IBaseRepository<IBooking> {
  findConflictingBookings(studentId: string, startTime: Date, endTime: Date, session?: ClientSession): Promise<IBooking[]>;
  getWeeklyStudentUsage(studentId: string, startDate: Date, endDate: Date, session?: ClientSession): Promise<number>;
  countDocuments(filter: FilterQuery<IBooking>, session?: ClientSession): Promise<number>;
  findScheduledByTimeSlot(timeSlotId: string): Promise<IBooking[]>;
  updateMany(filter: FilterQuery<IBooking>, update: any, session?: ClientSession): Promise<any>;
}
