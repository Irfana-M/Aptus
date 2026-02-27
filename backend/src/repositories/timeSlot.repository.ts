import { injectable } from 'inversify';
import { Types } from 'mongoose';
import type { ClientSession, FilterQuery, QueryOptions } from 'mongoose';
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
    const options: QueryOptions = { new: true };
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
    const options: QueryOptions = { new: true };
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
    const options: QueryOptions = { new: true };
    if (session) options.session = session;
    return await this.model.findOneAndUpdate(
      { _id: slotId, status: 'available' },
      { $set: { status: 'reserved' } }, // Using 'reserved' as the 'LOCKED' state
      options
    ).lean() as unknown as ITimeSlot | null;
  }

  async confirmBooking(slotId: string, session?: ClientSession): Promise<ITimeSlot | null> {
    const options: QueryOptions = { new: true };
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

  async countByMentorAndDate(mentorId: string, date: Date): Promise<number> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return await this.model.countDocuments({
      mentorId,
      startTime: { $gte: start, $lte: end },
      status: { $in: ['booked', 'reserved'] }
    });
  }

  async countByMentorAndWeek(mentorId: string, inputDate: Date): Promise<number> {
    const date = new Date(inputDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return await this.model.countDocuments({
      mentorId,
    });
  }

  async createOrUpdate(filter: FilterQuery<ITimeSlot>, data: Partial<ITimeSlot>): Promise<ITimeSlot | null> {
    return await this.model.findOneAndUpdate(
      filter,
      { $set: data },
      { upsert: true, new: true }
    ).lean() as unknown as ITimeSlot | null;
  }

  async ensureSlot(filter: FilterQuery<ITimeSlot>): Promise<ITimeSlot | null> {
    return await this.model.findOneAndUpdate(
      filter,
      { $setOnInsert: { status: 'available', maxStudents: 1, currentStudentCount: 0 } },
      { upsert: true, new: true }
    ).lean() as unknown as ITimeSlot | null;
  }

  async findAvailableSlotsWithMentor(filter: FilterQuery<ITimeSlot>): Promise<ITimeSlot[]> {
     return await this.model.find({ ...filter, status: 'available' })
       .populate('mentorId', 'fullName profilePicture')
       .lean() as unknown as ITimeSlot[];
  }

  async findActiveSlotsByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ITimeSlot[]> {
    return await this.model.find({
      mentorId: new Types.ObjectId(mentorId),
      startTime: { $gte: startDate, $lte: endDate },
      status: { $ne: 'cancelled' }
    }).lean() as unknown as ITimeSlot[];
  }

  async updateMany(filter: FilterQuery<ITimeSlot>, update: any, session?: ClientSession): Promise<any> {
    return await this.model.updateMany(filter, update).session(session || null).exec();
  }

  async deleteMany(filter: FilterQuery<ITimeSlot>, session?: ClientSession): Promise<any> {
    return await this.model.deleteMany(filter).session(session || null).exec();
  }

  async insertMany(docs: any[], session?: ClientSession): Promise<ITimeSlot[]> {
    return await this.model.insertMany(docs, { session: session || null }) as unknown as ITimeSlot[];
  }
}
