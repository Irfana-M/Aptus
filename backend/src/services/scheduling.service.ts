import { injectable, inject } from "inversify";
import mongoose from "mongoose";
import { TYPES } from "../types";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { getErrorMessage } from "../utils/errorUtils";

import type { ISchedulingService } from "../interfaces/services/ISchedulingService";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository";
import type { IBookingRepository } from "../interfaces/repositories/IBookingRepository";
import type { SchedulingOrchestrator } from "./scheduling/SchedulingOrchestrator";

import { TimeSlotModel } from "../models/scheduling/timeSlot.model";
import { BookingModel } from "../models/scheduling/booking.model";
import { MentorAvailabilityModel } from "../models/mentor/mentorAvailability.model";
import { StudentModel } from "../models/student/student.model";
import { StudentSubjectModel } from "../models/student/studentSubject.model";
import { StudentSubscriptionModel } from "../models/subscription/studentSubscription.model";

@injectable()
export class SchedulingService implements ISchedulingService {
  constructor(
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.IBookingRepository) private _bookingRepo: IBookingRepository,
    @inject(TYPES.SchedulingOrchestrator) private _orchestrator: SchedulingOrchestrator
  ) {}

  async generateSlots(projectionDays: number): Promise<void> {
    try {
      logger.info(`Generating slots for the next ${projectionDays} days`);
      
      const mentors = await this._mentorRepo.getAllMentors();
      const approvedMentors = mentors.filter(m => m.approvalStatus === 'approved' && m.isActive);

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const dayNames: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = 
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (const mentor of approvedMentors) {
        const availabilities = await MentorAvailabilityModel.find({ mentorId: mentor._id, isActive: true });
        
        for (let i = 1; i <= projectionDays; i++) {
          const currentPathDate = new Date(startDate);
          currentPathDate.setDate(startDate.getDate() + i);
          
          const dayName = dayNames[currentPathDate.getDay()];
          const dailyAvail = availabilities.find(a => a.dayOfWeek === dayName);

          if (dailyAvail) {
            for (const slot of dailyAvail.slots) {
              const startTimes = slot.startTime.split(':').map(Number);
              const endTimes = slot.endTime.split(':').map(Number);
              
              const startH = startTimes[0] ?? 0;
              const startM = startTimes[1] ?? 0;
              const endH = endTimes[0] ?? 0;
              const endM = endTimes[1] ?? 0;

              const slotStart = new Date(currentPathDate);
              slotStart.setHours(startH, startM, 0, 0);

              const slotEnd = new Date(currentPathDate);
              slotEnd.setHours(endH, endM, 0, 0);

              // Use upsert to avoid duplicates and handle race conditions during generation
              await TimeSlotModel.findOneAndUpdate(
                { 
                  mentorId: mentor._id as any, 
                  startTime: slotStart, 
                  endTime: slotEnd 
                },
                { 
                  $setOnInsert: { 
                    status: 'available',
                    sessionType: 'one-to-one', // Default, can be refined based on mentor settings
                    maxStudents: 1,           // Default for 1-to-1
                    currentStudentCount: 0
                  } 
                },
                { upsert: true }
              );
            }
          }
        }
      }
      logger.info('Slot generation completed');
    } catch (error) {
      logger.error(`Error in generateSlots: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async bookSlot(studentId: string, slotId: string, studentSubjectId: string): Promise<any> {
    logger.info(`Delegating booking for slot ${slotId} to Orchestrator`);
    return await this._orchestrator.bookSession(studentId, slotId, studentSubjectId);
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const booking = await BookingModel.findById(bookingId).session(session);
      if (!booking) throw new AppError("Booking not found", HttpStatusCode.NOT_FOUND);

      if (booking.status === 'cancelled') return;

      booking.status = 'cancelled';
      await booking.save({ session });

      // Atomically decrement slot count
      await TimeSlotModel.findByIdAndUpdate(
        booking.timeSlotId,
        { 
          $inc: { currentStudentCount: -1 },
          $set: { status: 'available' } // Transition back to available if it was booked
        },
        { session }
      );

      await session.commitTransaction();
      logger.info(`Booking ${bookingId} cancelled`);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async handleMentorLeave(mentorId: string, startDate: Date, endDate: Date): Promise<void> {
    try {
      logger.info(`Handling leave for mentor ${mentorId} from ${startDate} to ${endDate}`);
      
      const affectedSlots = await TimeSlotModel.find({
        mentorId: mentorId as any,
        startTime: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      });

      for (const slot of affectedSlots) {
        slot.status = 'cancelled';
        await slot.save();

        // Cancel all associated bookings
        await BookingModel.updateMany(
          { timeSlotId: slot._id, status: 'scheduled' },
          { status: 'cancelled' }
        );
        
        logger.info(`Slot ${slot._id} cancelled due to mentor leave`);
      }
    } catch (error) {
      logger.error(`Error handling mentor leave: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getAvailableSlots(filters: any): Promise<any[]> {
    const query: any = { status: 'available' };
    
    if (filters.subjectId) query.subjectId = filters.subjectId;
    if (filters.mentorId) query.mentorId = filters.mentorId;
    if (filters.date) {
        const startOfDay = new Date(filters.date);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(filters.date);
        endOfDay.setHours(23,59,59,999);
        query.startTime = { $gte: startOfDay, $lte: endOfDay };
    }

    return await TimeSlotModel.find(query).populate('mentorId', 'fullName profilePicture');
  }
}
