import { injectable } from "inversify";
import { TimeSlotModel } from "../../models/scheduling/timeSlot.model";

import type { ITimeSlotQueryService } from "../../interfaces/services/ITimeSlotQueryService";
import type { ITimeSlot } from "../../interfaces/models/timeSlot.interface";

@injectable()
export class TimeSlotQueryService implements ITimeSlotQueryService {
  async getAvailableSlots(filters: Record<string, unknown>): Promise<ITimeSlot[]> {
     const query: Record<string, unknown> = { status: 'available' };
    
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.mentorId) query.mentorId = filters.mentorId;
    if (filters.date) {
        const startOfDay = new Date(filters.date as string);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(filters.date as string);
        endOfDay.setHours(23,59,59,999);
        query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    return await TimeSlotModel.find(query).populate('mentorId', 'fullName profilePicture');
  }
}
