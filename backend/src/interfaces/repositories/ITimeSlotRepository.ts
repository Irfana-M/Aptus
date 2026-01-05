import type { FilterQuery, ClientSession } from 'mongoose';
import type { IBaseRepository } from './IBaseRepository';
import type { ITimeSlot } from '../models/timeSlot.interface';

export interface ITimeSlotRepository extends IBaseRepository<ITimeSlot> {
  reserveCapacity(slotId: string, session?: ClientSession): Promise<ITimeSlot | null>;
  releaseCapacity(slotId: string, session?: ClientSession): Promise<ITimeSlot | null>;
  findAvailableSlots(filter: FilterQuery<ITimeSlot>, session?: ClientSession): Promise<ITimeSlot[]>;
  reserveSlot(slotId: string, session?: ClientSession): Promise<ITimeSlot | null>;
  confirmBooking(slotId: string, session?: ClientSession): Promise<ITimeSlot | null>;
  countByMentorAndDate(mentorId: string, date: Date): Promise<number>;
  countByMentorAndWeek(mentorId: string, inputDate: Date): Promise<number>;
}
