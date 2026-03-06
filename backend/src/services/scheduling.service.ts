import { injectable, inject } from "inversify";
import mongoose from "mongoose";
import { TYPES } from "../types.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";
import { HttpStatusCode } from "../constants/httpStatus.js";
import { STUDENT_CANCEL_CUTOFF_HOURS } from "../config/leavePolicy.config.js";
import { MESSAGES } from "../constants/messages.constants.js";
import { BOOKING_STATUS } from "../constants/status.constants.js";

import type { ISchedulingService } from "../interfaces/services/ISchedulingService.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository.js";
import type { IBookingRepository } from "../interfaces/repositories/IBookingRepository.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { SchedulingOrchestrator } from "./scheduling/SchedulingOrchestrator.js";




@injectable()
export class SchedulingService implements ISchedulingService {
  constructor(
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.IBookingRepository) private _bookingRepo: IBookingRepository,
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository,
    @inject(TYPES.SchedulingOrchestrator) private _orchestrator: SchedulingOrchestrator,
    @inject(TYPES.IBookingSyncService) private _bookingSyncService: import("../interfaces/services/IBookingSyncService.js").IBookingSyncService,
    @inject(TYPES.ILeaveManagementService) private _leaveManagementService: import("../interfaces/services/ILeaveManagementService.js").ILeaveManagementService,
    @inject(TYPES.ITimeSlotQueryService) private _timeSlotQueryService: import("../interfaces/services/ITimeSlotQueryService.js").ITimeSlotQueryService,
    @inject(TYPES.ISlotGenerationService) private _slotGenerationService: import("../interfaces/services/ISlotGenerationService.js").ISlotGenerationService
  ) {}

  async generateSlots(projectionDays: number): Promise<void> {
    logger.info(`Delegating generateSlots to SlotGenerationService`);
    return this._slotGenerationService.generateSlots(projectionDays);
  }

  async generateMentorSlots(mentorId: string, projectionDays: number): Promise<void> {
    logger.info(`Delegating generateMentorSlots to SlotGenerationService`);
    return this._slotGenerationService.generateMentorSlots(mentorId, projectionDays);
  }

   async bookSlot(studentId: string, slotId: string, studentSubjectId: string): Promise<import("../interfaces/models/booking.interface.js").IBooking> {
    logger.info(`Delegating booking for slot ${slotId} to Orchestrator`);
    return await this._orchestrator.bookSession(studentId, slotId, studentSubjectId);
  }

  async cancelBooking(bookingId: string, initiator: 'student' | 'mentor' | 'admin', _reason?: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await this._bookingRepo.findById(bookingId, session);
      if (!booking) throw new AppError("Booking not found", HttpStatusCode.NOT_FOUND);

      if (booking.status === BOOKING_STATUS.CANCELLED) return;

      // Cutoff Validation: only for students
      if (initiator === 'student') {
          const timeSlot = await this._timeSlotRepo.findById(booking.timeSlotId.toString(), session);
          if (timeSlot) {
              const now = new Date();
              const diffInHours = (new Date(timeSlot.startTime).getTime() - now.getTime()) / (1000 * 60 * 60);
              
              if (diffInHours < STUDENT_CANCEL_CUTOFF_HOURS) {
                  logger.warn(`Student cancellation rejected: Booking ${bookingId} starts in ${diffInHours.toFixed(2)}h (Cutoff: ${STUDENT_CANCEL_CUTOFF_HOURS}h)`);
                  throw new AppError(MESSAGES.SESSION.CANCEL_CUTOFF_ERROR, HttpStatusCode.BAD_REQUEST);
              }
          }
      }

      await this._bookingRepo.updateById(bookingId, { status: BOOKING_STATUS.CANCELLED }, session);

      // Increment cancellation count for student if they initiated
      if (initiator === 'student') {
        const studentId = typeof booking.studentId === 'string' ? booking.studentId : (booking.studentId as any).toString();
        await this._studentRepo.incrementCancellationCount(studentId, session);
      }

      // Atomically decrement slot count
      const timeSlotId = typeof booking.timeSlotId === 'string' ? booking.timeSlotId : (booking.timeSlotId as any).toString();
      await this._timeSlotRepo.releaseCapacity(timeSlotId, session);

      await session.commitTransaction();
      logger.info(`Booking ${bookingId} cancelled by ${initiator}`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async processLeaveImpact(mentorId: string, startDate: Date, endDate: Date): Promise<void> {
    logger.info(`Delegating leave impact processing for mentor ${mentorId}`);
    return this._leaveManagementService.processLeaveImpact(mentorId, startDate, endDate);
  }

  async getAvailableSlots(filters: Record<string, unknown>): Promise<import("../interfaces/models/timeSlot.interface.js").ITimeSlot[]> {
    logger.info(`Delegating slot query to TimeSlotQueryService`);
    return this._timeSlotQueryService.getAvailableSlots(filters);
  }



  async ensureTimeSlot(mentorId: string, startTime: Date, endTime: Date): Promise<string> {
    logger.info(`Delegating ensureTimeSlot to SlotGenerationService`);
    return this._slotGenerationService.ensureTimeSlot(mentorId, startTime, endTime);
  }
}
