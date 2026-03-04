import { injectable } from "inversify";
import type { ClientSession } from "mongoose";
import { BaseRepository } from "./baseRepository.js";
import type { ITimeSlot } from "../interfaces/models/timeSlot.interface.js";
import { TimeSlotModel } from "../models/scheduling/timeSlot.model.js";
import type { IAvailabilityRepository } from "../interfaces/repositories/IAvailabilityRepository.js";

@injectable()
export class AvailabilityRepository extends BaseRepository<ITimeSlot> implements IAvailabilityRepository {
  constructor() {
    super(TimeSlotModel);
  }

  async reserveCapacity(slotId: string, session?: ClientSession): Promise<ITimeSlot | null> {
    return await TimeSlotModel.findByIdAndUpdate(
      slotId,
      { $inc: { currentStudentCount: 1 } },
      { new: true, session: session || null }
    ).lean() as unknown as ITimeSlot | null;
  }

  async findAvailableForSubject(subjectId: string, filters?: Record<string, unknown>): Promise<ITimeSlot[]> {
     const query: Record<string, unknown> = {
       subjectId,
       status: 'available',
       ...filters
     };
     return await TimeSlotModel.find(query).lean() as unknown as ITimeSlot[];
  }
}
