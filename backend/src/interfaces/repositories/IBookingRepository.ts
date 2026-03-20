import type { ClientSession, FilterQuery, UpdateQuery } from 'mongoose';
import type { IBaseRepository } from './IBaseRepository.js';
import type { IBooking } from '../models/booking.interface.js';

export interface IBookingRepository extends IBaseRepository<IBooking> {
  findConflictingBookings(studentId: string, startTime: Date, endTime: Date, session?: ClientSession): Promise<IBooking[]>;
  getWeeklyStudentUsage(studentId: string, startDate: Date, endDate: Date, session?: ClientSession): Promise<number>;
  countDocuments(filter: FilterQuery<IBooking>, session?: ClientSession): Promise<number>;
  findScheduledByTimeSlot(timeSlotId: string): Promise<IBooking[]>;
  updateMany(filter: FilterQuery<IBooking>, update: UpdateQuery<IBooking>, session?: ClientSession): Promise<unknown>;
  findOneWithPopulate(filter: FilterQuery<IBooking>, populate: string | string[], session?: ClientSession): Promise<IBooking | null>;
}
