import { injectable } from 'inversify';
import type { ClientSession, FilterQuery } from 'mongoose';
import { BaseRepository } from './baseRepository';
import type { IBookingRepository } from '../interfaces/repositories/IBookingRepository';
import type { IBooking } from '../interfaces/models/booking.interface';
import { BookingModel } from '../models/scheduling/booking.model';

@injectable()
export class BookingRepository extends BaseRepository<IBooking> implements IBookingRepository {
  constructor() {
    super(BookingModel);
  }

  async findConflictingBookings(studentId: string, startTime: Date, endTime: Date, session?: ClientSession): Promise<IBooking[]> {
    
    return await this.model.find({
      studentId,
      status: 'scheduled'
    })
    .populate({
      path: 'timeSlotId',
      match: {
        $or: [
          { startTime: { $lt: endTime, $gte: startTime } },
          { endTime: { $gt: startTime, $lte: endTime } },
          { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
      }
    })
    .session(session || null)
    .then(bookings => bookings.filter(b => b.timeSlotId !== null));
  }

  async getWeeklyStudentUsage(studentId: string, startDate: Date, endDate: Date, session?: ClientSession): Promise<number> {
    return await this.model.countDocuments({
      studentId,
      status: 'scheduled',
      createdAt: { $gte: startDate, $lte: endDate }
    }).session(session || null);
  }

  async countDocuments(filter: FilterQuery<IBooking>, session?: ClientSession): Promise<number> {
    return await this.model.countDocuments(filter).session(session || null);
  }

  async findScheduledByTimeSlot(timeSlotId: string): Promise<IBooking[]> {
    return await this.model.find({ timeSlotId, status: 'scheduled' }).lean() as unknown as IBooking[];
  }

  async updateMany(filter: FilterQuery<IBooking>, update: any, session?: ClientSession): Promise<any> {
    return await this.model.updateMany(filter, update).session(session || null).exec();
  }
}
