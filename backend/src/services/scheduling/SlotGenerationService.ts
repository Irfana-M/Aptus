import { injectable, inject } from "inversify";
import mongoose from "mongoose";
import { TYPES } from "../../types.js";
import { logger } from "../../utils/logger.js";
import { getErrorMessage } from "../../utils/errorUtils.js";
import { AppError } from "../../utils/AppError.js";
import { HttpStatusCode } from "../../constants/httpStatus.js";
import type { ISlotGenerationService } from "../../interfaces/services/ISlotGenerationService.js";
import type { IMentorRepository } from "../../interfaces/repositories/IMentorRepository.js";
import type { IBookingSyncService } from "../../interfaces/services/IBookingSyncService.js";
import type { IMentorAvailabilityRepository } from "../../interfaces/repositories/IMentorAvailabilityRepository.js";
import type { IStudentEnrollmentRepository } from "../../interfaces/repositories/IStudentEnrollmentRepository.js";
import type { ICourseRepository } from "../../interfaces/repositories/ICourseRepository.js";
import type { ITimeSlotRepository } from "../../interfaces/repositories/ITimeSlotRepository.js";
import { combineISTToUTC } from "../../utils/time.util.js";

@injectable()
export class SlotGenerationService implements ISlotGenerationService {
  constructor(
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.IBookingSyncService) private _bookingSyncService: IBookingSyncService,
    @inject(TYPES.IMentorAvailabilityRepository) private _mentorAvailabilityRepo: IMentorAvailabilityRepository,
    @inject(TYPES.IStudentEnrollmentRepository) private _studentEnrollmentRepo: IStudentEnrollmentRepository,
    @inject(TYPES.ICourseRepository) private _courseRepo: ICourseRepository,
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository
  ) {}

  async generateSlots(projectionDays: number): Promise<void> {
    try {
      logger.info(`🚀 [SlotGen] Starting generation for ${projectionDays} days for all approved mentors`);
      const mentors = await this._mentorRepo.getAllMentors();
      const approvedMentors = mentors.filter(m => m.approvalStatus === 'approved' && m.isActive);
      logger.info(`📊 [SlotGen] Found ${approvedMentors.length} approved mentors to process`);

      for (const mentor of approvedMentors) {
        if (mentor._id) {
          await this.generateMentorSlots(mentor._id.toString(), projectionDays);
        }
      }
      logger.info('✅ [SlotGen] Slot generation completed for all mentors');
    } catch (error) {
      logger.error(`Error in generateSlots: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async generateMentorSlots(mentorId: string, projectionDays: number): Promise<void> {
    try {
      logger.info(`🚀 [SlotGen] Generating slots for mentor ${mentorId} for the next ${projectionDays} days`);
      
      const availabilities = await this._mentorAvailabilityRepo.findActiveByMentor(mentorId);
      
      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);

      // Fetch active courses for this mentor to sync slots
      const mentorCourses = await this._courseRepo.findActiveCoursesByMentor(mentorId);

      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      
      const dayNames: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = 
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      let generatedCount = 0;

      for (let i = 0; i <= projectionDays; i++) { 
        const currentPathDate = new Date(startDate);
        currentPathDate.setDate(startDate.getDate() + i);
        
        // Check for approved leaves
        const isOnLeave = mentor.leaves?.some(leave => 
          leave.approved && 
          currentPathDate >= new Date(new Date(leave.startDate).setHours(0,0,0,0)) && 
          currentPathDate <= new Date(new Date(leave.endDate).setHours(23,59,59,999))
        );

        if (isOnLeave) {
          logger.info(`[GenSlots] 🏝️ Mentor ${mentorId} is on approved leave on ${currentPathDate.toDateString()}. Skipping.`);
          continue;
        }

        const dayName = dayNames[currentPathDate.getDay()];
        logger.info(`[GenSlots] Checking ${currentPathDate.toDateString()} (${dayName}) for Mentor ${mentorId}`);

        const dailyAvail = availabilities.find(a => a.dayOfWeek === dayName);

        if (dailyAvail) {
          logger.info(`[GenSlots] Found availability for ${dayName}: ${dailyAvail.slots.length} slots`);
          for (const slot of dailyAvail.slots) {
            const slotStart = combineISTToUTC(currentPathDate, slot.startTime);
            const slotEnd = combineISTToUTC(currentPathDate, slot.endTime);

            // Check if any course matches this day and time
            const matchingCourse = mentorCourses.find(c => {
              const withinDateRange = slotStart >= c.startDate && slotStart <= c.endDate;
              const matchesDay = dayName ? c.schedule.days.includes(dayName) : false;
              const matchesTime = c.schedule.timeSlot === `${slot.startTime}-${slot.endTime}`;
              
              if (matchesDay && matchesTime) {
                  const reason = !withinDateRange ? 'DateOutOfRange' : 'MATCH';
                  logger.info(`[GenSlots] Course ${c.subject} candidate: ${reason}. Range: ${c.startDate.toISOString()} - ${c.endDate.toISOString()} vs ${slotStart.toISOString()}`);
              }
              
              return withinDateRange && matchesDay && matchesTime;
            });

            let slotStatus: 'available' | 'booked' = 'available';
            let subjectId = null;
            let maxStudents = 1;
            let currentCount = 0;

            if (matchingCourse) {
              slotStatus = 'booked';
              subjectId = matchingCourse.subject;
              maxStudents = matchingCourse.maxStudents || (matchingCourse.courseType === 'group' ? 5 : 1);
              currentCount = matchingCourse.enrolledStudents || 0;
            }

            // Use upsert to avoid duplicates
            // We use standard string for IDs in repo calls
            const timeSlot = await this._timeSlotRepo.createOrUpdate(
              { 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                mentorId: new mongoose.Types.ObjectId(mentorId) as any, 
                startTime: slotStart, 
                endTime: slotEnd 
              },
              { 
                status: slotStatus,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                subjectId: subjectId as any,
                maxStudents: maxStudents,
                currentStudentCount: currentCount
              }
            );
            
            if (timeSlot) generatedCount++;
            
            // If it's a booked course slot, ensure Bookings exist for enrolled students
            if (matchingCourse && timeSlot) {
              const tsId = (timeSlot as unknown as { _id: { toString(): string } })._id.toString();
              const subId = matchingCourse.subject.toString();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const courseId = (matchingCourse as any)._id.toString();

              if (matchingCourse.courseType === 'one-to-one' && matchingCourse.student) {
                await this._bookingSyncService.ensureBookingExists(matchingCourse.student.toString(), tsId, subId);
              } else if (matchingCourse.courseType === 'group') {
                const links = await this._studentEnrollmentRepo.findActiveByCourseId(courseId);
                for (const link of links) {
                  await this._bookingSyncService.ensureBookingExists(link.student.toString(), tsId, subId);
                }
              }
            }
          }
        }
      }
      logger.info(`✅ [SlotGen] Completed: Generated/Updated ${generatedCount} slots for mentor ${mentorId}`);
    } catch (error) {
      logger.error(`Error in generateMentorSlots: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async ensureTimeSlot(mentorId: string, startTime: Date, endTime: Date): Promise<string> {
    try {
        const slot = await this._timeSlotRepo.ensureSlot({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mentorId: new mongoose.Types.ObjectId(mentorId) as any,
            startTime,
            endTime
        });
        
        if (!slot) throw new AppError("Failed to ensure time slot", HttpStatusCode.INTERNAL_SERVER_ERROR);

        return (slot as unknown as { _id: { toString(): string } })._id.toString();
    } catch (error) {
        logger.error(`Error in ensureTimeSlot: ${getErrorMessage(error)}`);
        throw error;
    }
  }
}
