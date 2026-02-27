import type { ITimeSlot } from "../models/timeSlot.interface";

export interface ITimeSlotQueryService {
  getAvailableSlots(filters: Record<string, unknown>): Promise<ITimeSlot[]>;
}
