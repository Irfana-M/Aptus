import { injectable, inject } from "inversify";
import { BookingModel } from "../../models/scheduling/booking.model.js";
import { logger } from "../../utils/logger.js";
import { getErrorMessage } from "../../utils/errorUtils.js";
import { TYPES } from "../../types.js";
import type { IBookingSyncService } from "../../interfaces/services/IBookingSyncService.js";
import type { IStudentSubjectRepository } from "../../interfaces/repositories/IStudentSubjectRepository.js";

@injectable()
export class BookingSyncService implements IBookingSyncService {
  constructor(
    @inject(TYPES.IStudentSubjectRepository) private _studentSubjectRepo: IStudentSubjectRepository
  ) {}
  
  async ensureBookingExists(studentId: string, timeSlotId: string, subjectId: string): Promise<void> {
    try {
      // We don't have studentSubjectId easily, but we can look it up or use a surrogate
      const studentSubject = await this._studentSubjectRepo.findByStudentAndSubject(studentId, subjectId);
      if (!studentSubject) {
        logger.warn(`No StudentSubject found for student ${studentId} and subject ${subjectId}, cannot create booking for slot ${timeSlotId}`);
        return;
      }

      await BookingModel.findOneAndUpdate(
        { studentId, timeSlotId },
        { 
          $setOnInsert: { 
            studentSubjectId: studentSubject._id,
            status: 'scheduled'
          } 
        },
        { upsert: true }
      );
    } catch (error) {
      logger.error(`Error in ensureBookingExists: ${getErrorMessage(error)}`);
    }
  }
}
