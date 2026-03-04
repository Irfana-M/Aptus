import type { ITimeSlot } from "../models/timeSlot.interface.js";

export interface ITimeSlotQueryService {
  getAvailableSlots(filters: Record<string, unknown>): Promise<ITimeSlot[]>;
}
