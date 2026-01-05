import { injectable } from 'inversify';
import type { ClientSession, FilterQuery } from 'mongoose';
import { BaseRepository } from './baseRepository';
import type { ITimeSlotRepository } from '../interfaces/repositories/ITimeSlotRepository';
import type { ITimeSlot } from '../interfaces/models/timeSlot.interface';
import { TimeSlotModel } from '../models/scheduling/timeSlot.model';

@injectable()
export class TimeSlotRepository extends BaseRepository<ITimeSlot> implements ITimeSlotRepository {
  constructor() {
    super(TimeSlotModel);
  }

  async reserveCapacity(slotId: string, session?: ClientSession): Promise<ITimeSlot | null> {
    const options: any = { new: true };
    if (session) options.session = session;
    return await this.model.findOneAndUpdate(
      {
        _id: slotId,
        status: { $in: ['available', 'reserved'] },
        $expr: { $lt: ["$currentStudentCount", "$maxStudents"] }
      },
      [
        {
          $set: {
            currentStudentCount: { $add: ["$currentStudentCount", 1] },
            status: {
              $cond: [
                { $eq: [{ $add: ["$currentStudentCount", 1] }, "$maxStudents"] },
                "booked",
                "available"
              ]
            }
          }
        }
      ],
      options
    ).lean() as unknown as ITimeSlot | null;
  }

  async releaseCapacity(slotId: string, session?: ClientSession): Promise<ITimeSlot | null> {
    const options: any = { new: true };
    if (session) options.session = session;
    return await this.model.findOneAndUpdate(
      { _id: slotId },
      {
        $inc: { currentStudentCount: -1 },
        $set: { status: 'available' }
      },
      options
    ).lean() as unknown as ITimeSlot | null;
  }

  async findAvailableSlots(filter: FilterQuery<ITimeSlot>, session?: ClientSession): Promise<ITimeSlot[]> {
     const query = this.model.find({ ...filter, status: 'available' });
     if (session) query.session(session);
     return await query.exec();
  }

  async reserveSlot(slotId: string, session?: ClientSession): Promise<ITimeSlot | null> {
    const options: any = { new: true };
    if (session) options.session = session;
    return await this.model.findOneAndUpdate(
      { _id: slotId, status: 'available' },
      { $set: { status: 'reserved' } }, // Using 'reserved' as the 'LOCKED' state
      options
    ).lean() as unknown as ITimeSlot | null;
  }

  async confirmBooking(slotId: string, session?: ClientSession): Promise<ITimeSlot | null> {
    const options: any = { new: true };
    if (session) options.session = session;
    return await this.model.findOneAndUpdate(
      { _id: slotId, status: 'reserved' },
      { 
        $set: { status: 'booked' },
        $inc: { currentStudentCount: 1 } 
      },
      options
    ).lean() as unknown as ITimeSlot | null;
  }
}
