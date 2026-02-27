import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';
import { TYPES } from '../../types';
import type { ITimeSlotRepository } from '../../interfaces/repositories/ITimeSlotRepository';
import type { IBookingRepository } from '../../interfaces/repositories/IBookingRepository';
import type { IMentorRepository } from '../../interfaces/repositories/IMentorRepository';
import type { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';
import { SchedulingPolicy } from '../../domain/scheduling/SchedulingPolicy';
import { AppError } from '../../utils/AppError';
import { HttpStatusCode } from '../../constants/httpStatus';
import { logger } from '../../utils/logger';
import { EVENTS, type InternalEventEmitter } from '../../utils/InternalEventEmitter';
import type { IChatService } from '../../interfaces/services/IChatService';
import type { IPricingService } from '../../interfaces/services/IPricingService';

@injectable()
export class SchedulingOrchestrator {
  constructor(
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.IBookingRepository) private _bookingRepo: IBookingRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository,
    @inject(TYPES.SchedulingPolicy) private _policy: SchedulingPolicy,
    @inject(TYPES.InternalEventEmitter) private _eventEmitter: InternalEventEmitter,
    @inject(TYPES.IChatService) private _chatService: IChatService,
    @inject(TYPES.IPricingService) private _pricingService: IPricingService
  ) {}

  async bookSession(studentId: string, slotId: string, subjectId: string): Promise<import('../../interfaces/models/booking.interface').IBooking> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Core Lookups
      const student = await this._studentRepo.findById(studentId);
      if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);

      const slot = await this._timeSlotRepo.findById(slotId);
      if (!slot) throw new AppError("Time slot not found", HttpStatusCode.NOT_FOUND);

      // 2. Domain Validation via Policy
      const studentBookings = await this._bookingRepo.findConflictingBookings(
        studentId, 
        slot.startTime, 
        slot.endTime,
        session
      );

      const policyCheck = this._policy.canStudentBook(student as unknown as import('../../interfaces/models/student.interface').StudentProfile, slot, studentBookings);
      if (!policyCheck.allowed) {
        throw new AppError(policyCheck.reason || "Booking rejected by policy", HttpStatusCode.CONFLICT);
      }

      // 2.5 Calculate Session Cost
      const { cost, currency } = await this._pricingService.calculateSessionCost(studentId);

      // 3. Mentor Limit Check
      const mentor = await this._mentorRepo.findById(slot.mentorId.toString());
      // (Simplified daily check for now, can be expanded)
      const dailyCount = await this._bookingRepo.countDocuments({
        mentorId: slot.mentorId,
        startTime: { $gte: new Date(new Date(slot.startTime).setHours(0,0,0,0)) }
      }, session);

      const limitCheck = this._policy.isMentorWithinLimits(mentor, dailyCount, 0);
      if (!limitCheck.allowed) {
          throw new AppError(limitCheck.reason || "Mentor limits exceeded", HttpStatusCode.CONFLICT);
      }

      // 4. Atomic Execution
      const updatedSlot = await this._timeSlotRepo.reserveCapacity(slotId, session);
      if (!updatedSlot) {
        throw new AppError("Failed to reserve slot capacity", HttpStatusCode.CONFLICT);
      }

      const booking = await this._bookingRepo.create({
        studentId: new mongoose.Types.ObjectId(studentId) as unknown as import('mongoose').Schema.Types.ObjectId,
        studentSubjectId: new mongoose.Types.ObjectId(subjectId) as unknown as import('mongoose').Schema.Types.ObjectId,
        timeSlotId: new mongoose.Types.ObjectId(slotId) as unknown as import('mongoose').Schema.Types.ObjectId,
        status: 'scheduled',
        cost,
        currency
      }, session);

      await session.commitTransaction();
      logger.info(`Booking successful: ${booking._id}`); // Updated log message

      // Emit events for notifications (decoupled)
      this._eventEmitter.emit(EVENTS.SESSION_SCHEDULED, {
        sessionId: (booking as unknown as { _id: { toString(): string } })._id.toString(),
        studentId: (student as unknown as { _id: { toString(): string } })._id.toString(),
        mentorId: slot.mentorId.toString(),
        subjectName: "Your Subject", // Should be fetched properly in full impl
        startTime: slot.startTime,
        endTime: slot.endTime
      });

      // Legacy support
      this._eventEmitter.emit(EVENTS.BOOKING_CREATED, {
        studentId: (student as unknown as { _id: { toString(): string } })._id.toString(),
        studentEmail: (student as unknown as { email: string }).email,
        subjectName: "Your Subject",
        startTime: slot.startTime.toISOString(),
      });

      // Note: In a full implementation, a Session record would be created here.
      // Once a session is 'in_progress', we should initiate the chat room.
      // For now, we'll keep it as a placeholder or emit an event that triggers it.

      return booking;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
