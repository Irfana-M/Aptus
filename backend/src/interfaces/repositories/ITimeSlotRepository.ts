import type { FilterQuery, ClientSession, UpdateQuery } from 'mongoose';
import type { IBaseRepository } from './IBaseRepository.js';
import type { ITimeSlot } from '../models/timeSlot.interface.js';

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
  updateMany(filter: FilterQuery<ITimeSlot>, update: UpdateQuery<ITimeSlot>, session?: ClientSession): Promise<unknown>;
  deleteMany(filter: FilterQuery<ITimeSlot>, session?: ClientSession): Promise<unknown>;
  insertMany(docs: Partial<ITimeSlot>[], session?: ClientSession): Promise<ITimeSlot[]>;
}
