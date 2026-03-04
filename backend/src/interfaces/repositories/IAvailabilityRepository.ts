import type { ITimeSlot } from "../models/timeSlot.interface.js";
import type { IBaseRepository } from "./IBaseRepository.js";
import type { ClientSession } from "mongoose";

export interface IAvailabilityRepository extends IBaseRepository<ITimeSlot> {
  reserveCapacity(slotId: string, session?: ClientSession): Promise<ITimeSlot | null>;
  findAvailableForSubject(subjectId: string, filters?: Record<string, unknown>): Promise<ITimeSlot[]>;
}
