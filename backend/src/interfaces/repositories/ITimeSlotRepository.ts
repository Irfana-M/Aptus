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
  createOrUpdate(filter: Partial<ITimeSlot>, data: Partial<ITimeSlot>): Promise<ITimeSlot | null>;
  createOrUpdate(filter: Partial<ITimeSlot>, data: Partial<ITimeSlot>): Promise<ITimeSlot | null>;
  ensureSlot(filter: Partial<ITimeSlot>): Promise<ITimeSlot | null>;
  findAvailableSlotsWithMentor(filter: FilterQuery<ITimeSlot>): Promise<ITimeSlot[]>;
  findActiveSlotsByMentorAndDateRange(mentorId: string, startDate: Date, endDate: Date): Promise<ITimeSlot[]>;
  updateMany(filter: FilterQuery<ITimeSlot>, update: any, session?: ClientSession): Promise<any>;
  deleteMany(filter: FilterQuery<ITimeSlot>, session?: ClientSession): Promise<any>;
  insertMany(docs: any[], session?: ClientSession): Promise<ITimeSlot[]>;
}
