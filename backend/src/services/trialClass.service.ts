import type { ITrialClassDocument } from "@/models/student/trialClass.model.js";
import type { OnboardingEvent } from "@/enums/studentOnboarding.enum.js";

import { inject, injectable } from "inversify";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository.js";
import type { ITrialClassService } from "@/interfaces/services/ITrialClassService.js";
import type { IStudentService } from "@/interfaces/services/IStudentService.js";
import type { IAttendanceService } from "@/interfaces/services/IAttendanceService.js";
import type { TrialEligibilityPolicy } from "@/domain/policy/TrialEligibilityPolicy.js";
import type { TrialClassRequestDto, TrialClassResponseDto } from "@/dtos/student/trialClassDTO.js";
import type { INotificationService } from "@/interfaces/services/INotificationService.js";
import { TYPES } from "@/types.js";
import { logger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";
import { HttpStatusCode } from "@/constants/httpStatus.js";
import { MESSAGES } from "@/constants/messages.constants.js";
import { TrialClassMapper } from "@/mappers/trialClassMapper.js";
import { Types } from "mongoose";
import type { IMentorRepository } from "@/interfaces/repositories/IMentorRepository.js";
import type { ICourseRepository } from "@/interfaces/repositories/ICourseRepository.js";
import { InternalEventEmitter, EVENTS } from "@/utils/InternalEventEmitter.js";

@injectable()
export class TrialClassService implements ITrialClassService {
  constructor(
    @inject(TYPES.ITrialClassRepository)
    private trialRepo: ITrialClassRepository,
    @inject(TYPES.TrialEligibilityPolicy)
    private policy: TrialEligibilityPolicy,
    @inject(TYPES.IStudentService)
    private studentService: IStudentService,
    @inject(TYPES.INotificationService)
    private notificationService: INotificationService,
    @inject(TYPES.IMentorRepository)
    private mentorRepo: IMentorRepository,
    @inject(TYPES.ICourseRepository)
    private courseRepo: ICourseRepository,
    @inject(TYPES.InternalEventEmitter)
    private eventEmitter: InternalEventEmitter,
    @inject(TYPES.IAttendanceService)
    private attendanceService: IAttendanceService
  ) {}

  private getStringId(
    field: unknown
  ): string {
    if (!field) return "";
    if (field instanceof Types.ObjectId) return field.toString();
    if (typeof field === "string") return field;
    
    // Handle objects with _id property (like populated docs)
    if (field && typeof field === 'object' && '_id' in field) {
      const fieldWithId = field as { _id: unknown };
      if (fieldWithId._id) {
        return fieldWithId._id.toString();
      }
    }
    return "";
  }

  async requestTrialClass(
    data: TrialClassRequestDto,
    studentId: string
  ): Promise<TrialClassResponseDto> {
    try {
      this.policy.validateRequest(data);
      await this.validateSubjectExists(data.subject);

      const newTrial = await this.trialRepo.createTrialRequest({
        student: studentId,
        subject: data.subject,
        preferredDate: new Date(data.preferredDate),
        preferredTime: data.preferredTime,
        status: "requested",
      });

      const populatedTrial = await this.trialRepo.findById(newTrial._id.toString());
      if (!populatedTrial) throw new AppError(MESSAGES.TRIAL_CLASS.CREATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);

      logger.info(`Trial class requested by student ${studentId}`);
      
      // Advance onboarding to TRIAL_BOOKED
      try {
          await this.studentService.advanceOnboarding(studentId, 'TRIAL_BOOKED' as OnboardingEvent);
      } catch (error) {
          logger.warn(`Could not advance onboarding to TRIAL_BOOKED for ${studentId}`, error);
      }
      
      // Notify student about successful booking
      try {
          const subjectName = typeof populatedTrial.subject === 'object' && populatedTrial.subject && 'subjectName' in populatedTrial.subject 
            ? (populatedTrial.subject as unknown as { subjectName: string }).subjectName 
            : 'your selected subject';
          await this.notificationService.notifyUser(
            studentId,
            'student',
            'trial_booked',
            {
              subjectName,
              preferredDate: data.preferredDate,
              preferredTime: data.preferredTime
            },
            ['web']
          );
      } catch (error) {
          logger.warn(`Could not send trial_booked notification for ${studentId}`, error);
      }

      // NEW: Emit event for Admin notification
      try {
        const studentName = (populatedTrial.student as unknown as { fullName?: string })?.fullName || "Student";
        const subjectName = typeof populatedTrial.subject === 'object' && populatedTrial.subject && 'subjectName' in populatedTrial.subject 
            ? (populatedTrial.subject as unknown as { subjectName: string }).subjectName 
            : 'your selected subject';

        this.eventEmitter.emit(EVENTS.TRIAL_BOOKED, {
          studentId,
          studentName,
          subjectName
        });
      } catch (error) {
        logger.warn(`Could not emit TRIAL_BOOKED event for ${studentId}`, error);
      }

      return TrialClassMapper.toResponseDto(populatedTrial);
    } catch (error) {
      logger.error("Error creating trial class", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.CREATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getStudentTrialClasses(studentId: string, page: number = 1, limit: number = 10): Promise<{ items: TrialClassResponseDto[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [trials, total] = await Promise.all([
        this.trialRepo.findByStudentId(studentId, undefined, skip, limit),
        this.trialRepo.countByStudentId(studentId)
      ]);
      return {
        items: trials.map(TrialClassMapper.toResponseDto),
        total
      };
    } catch (error) {
      logger.error("Error fetching student trial classes", error);
      throw new AppError(MESSAGES.TRIAL_CLASS.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTrialClassById(id: string, userId: string): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(id);
      if (!trial) throw new AppError(MESSAGES.TRIAL_CLASS.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      const trialStudentId = this.getStringId(trial.student);
      const trialMentorId = this.getStringId(trial.mentor);
      
      console.log('🧐 [TrialService] Access check:', {
        trialId: id,
        userId,
        trialStudentId,
        trialMentorId,
        matchStudent: trialStudentId === userId,
        matchMentor: trialMentorId === userId
      });

      if (trialStudentId !== userId && trialMentorId !== userId) {
        throw new AppError(MESSAGES.TRIAL_CLASS.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
      }

      return TrialClassMapper.toResponseDto(trial);
    } catch (error) {
      logger.error("Error fetching trial class", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async assignMentor(trialClassId: string, mentorId: string, meetLink: string): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(trialClassId);
      if (!trial) throw new AppError(MESSAGES.TRIAL_CLASS.NOT_FOUND, HttpStatusCode.NOT_FOUND);
      
      this.policy.canAssignMentor(trial);

      const updated = await this.trialRepo.updateTrial(trialClassId, {
        mentor: new Types.ObjectId(mentorId) as unknown as Types.ObjectId,
        meetLink,
        status: "assigned",
      } as unknown as Partial<ITrialClassDocument>);

      if (!updated) throw new AppError(MESSAGES.TRIAL_CLASS.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      // Notify student and mentor
      try {
        const studentId = this.getStringId(updated.student);
        const mentorId = this.getStringId(updated.mentor);
        const studentName = (updated.student as unknown as { fullName?: string })?.fullName || "Student";
        const mentorName = (updated.mentor as unknown as { fullName?: string })?.fullName || "Mentor";
        const subjectName = (updated.subject as unknown as { subjectName?: string })?.subjectName || "Subject";

        await this.notificationService.notifyMentorAssigned(
          studentId,
          studentName,
          mentorId,
          mentorName,
          subjectName
        );
      } catch (error) {
        logger.warn("Failed to send trial class assignment notifications", error);
      }

      return TrialClassMapper.toResponseDto(updated);
    } catch (error) {
      logger.error("Error assigning mentor", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.ASSIGN_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateTrialClass(
    trialClassId: string,
    studentId: string,
    updates: {
      subject?: string;
      preferredDate?: string;
      preferredTime?: string;
      notes?: string;
    }
  ): Promise<TrialClassResponseDto> {
    try {
      const existingTrial = await this.trialRepo.findById(trialClassId);
      if (!existingTrial) throw new AppError(MESSAGES.TRIAL_CLASS.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      this.policy.canUpdate(existingTrial, studentId);

      if (updates.subject) await this.validateSubjectExists(updates.subject);

      const updateData: Record<string, unknown> = {};
      if (updates.subject) updateData.subject = new Types.ObjectId(updates.subject);
      if (updates.preferredDate) updateData.preferredDate = new Date(updates.preferredDate);
      if (updates.preferredTime) updateData.preferredTime = updates.preferredTime;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const updatedTrial = await this.trialRepo.updateTrial(trialClassId, updateData as unknown as Partial<ITrialClassDocument>);
      if (!updatedTrial) throw new AppError(MESSAGES.TRIAL_CLASS.UPDATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (error) {
      logger.error("Error updating trial class", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.UPDATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async submitFeedback(
    trialClassId: string,
    studentId: string,
    feedback: { rating: number; comment?: string }
  ): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(trialClassId);
      if (!trial) throw new AppError(MESSAGES.TRIAL_CLASS.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      this.policy.canSubmitFeedback(trial, studentId);

      const trialStudentId = this.getStringId(trial.student);

      const updatedTrial = await this.trialRepo.updateTrial(trialClassId, {
        feedback: { rating: feedback.rating, comment: feedback.comment || "" },
        status: "completed",
      });

      if (!updatedTrial) throw new AppError(MESSAGES.TRIAL_CLASS.FEEDBACK_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);

      const { StudentModel } = await import("../models/student/student.model.js");
      await StudentModel.findByIdAndUpdate(trialStudentId, { isTrialCompleted: true });
      
      // Advance onboarding status to FEEDBACK_SUBMITTED
      await this.studentService.advanceOnboarding(trialStudentId, 'FEEDBACK_SUBMITTED' as OnboardingEvent);

      // Create trial-derived attendance
      try {
        const trialMentorId = this.getStringId(updatedTrial.mentor);
        if (trialMentorId) {
            await this.attendanceService.createTrialDerivedAttendance(trialClassId, trialStudentId, trialMentorId);
        }
      } catch (error) {
        logger.warn(`Could not create trial-derived attendance for trial ${trialClassId}`, error);
      }

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (error: unknown) {
      const errorObj = error as Error;
      logger.error("Error submitting feedback", {
          message: errorObj?.message,
          stack: errorObj?.stack,
          trialClassId,
          studentId
      });
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.FEEDBACK_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getMentorTrialClasses(mentorId: string, page: number = 1, limit: number = 10): Promise<{ items: TrialClassResponseDto[]; total: number }> {
    try {
      const skip = (page - 1) * limit;
      const [trials, total] = await Promise.all([
        this.trialRepo.findByMentorId(mentorId, skip, limit),
        this.trialRepo.countByMentorId(mentorId)
      ]);
      return {
        items: trials.map(TrialClassMapper.toResponseDto),
        total
      };
    } catch (error) {
      logger.error("Error fetching mentor trial classes", error);
      throw new AppError(MESSAGES.TRIAL_CLASS.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTodayTrialClasses(mentorId: string): Promise<TrialClassResponseDto[]> {
    try {
      const trials = await this.trialRepo.findByMentorId(mentorId);
      const today = new Date().toDateString();
      const todayTrials = trials.filter(trial => new Date(trial.preferredDate).toDateString() === today);
      return todayTrials.map(TrialClassMapper.toResponseDto);
    } catch (error) {
      logger.error("Error fetching today's trial classes", error);
      throw new AppError(MESSAGES.TRIAL_CLASS.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getTrialClassStats(mentorId: string): Promise<{ total: number; completed: number; upcoming: number }> {
    try {
      const trials = await this.trialRepo.findByMentorId(mentorId);

      const total = trials.length;
      const completed = trials.filter(trial => trial.status === "completed").length;
      const now = new Date();
      const upcoming = trials.filter(trial => trial.status === "assigned" && new Date(trial.preferredDate) > now).length;

      return { total, completed, upcoming };
    } catch (error) {
      logger.error("Error fetching trial class stats", error);
      throw new AppError(MESSAGES.TRIAL_CLASS.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async updateTrialClassStatus(
    trialClassId: string,
    status: "assigned" | "completed" | "cancelled",
    reason?: string
  ): Promise<TrialClassResponseDto> {
    try {
      const updateData: Record<string, unknown> = { status };
      if (reason && status === "cancelled") updateData.cancellationReason = reason;

      const updated = await this.trialRepo.updateTrial(trialClassId, updateData as unknown as Partial<ITrialClassDocument>);
      if (!updated) throw new AppError(MESSAGES.TRIAL_CLASS.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      if (status === "completed") {
      const trialStudentId = this.getStringId(updated.student);
      const { StudentModel } = await import("../models/student/student.model.js");
      await StudentModel.findByIdAndUpdate(trialStudentId, { isTrialCompleted: true });
      logger.info(`✅ Student ${trialStudentId} marked as isTrialCompleted: true`);

      // Advance onboarding status to TRIAL_ATTENDED (if possible)
      try {
        await this.studentService.advanceOnboarding(trialStudentId, 'TRIAL_ATTENDED' as OnboardingEvent);
      } catch (onboardingError) {
        // If the student is already past this status or transition is invalid, log but don't fail
        logger.warn(`Could not advance onboarding for student ${trialStudentId} to TRIAL_ATTENDED:`, onboardingError);
      }

      // Notify student
      const studentName = (updated.student as unknown as { fullName?: string })?.fullName || "Student";
      const subjectName = (updated.subject as unknown as { subjectName?: string })?.subjectName || "Subject";
      
      await this.notificationService.notifyTrialCompleted(
          trialStudentId,
          studentName,
          subjectName
      );

      // Create trial-derived attendance
      try {
        const trialMentorId = this.getStringId(updated.mentor);
        if (trialMentorId) {
            await this.attendanceService.createTrialDerivedAttendance(trialClassId, trialStudentId, trialMentorId);
        }
      } catch (error) {
        logger.warn(`Could not create trial-derived attendance for trial ${trialClassId}`, error);
      }
    }

      return TrialClassMapper.toResponseDto(updated);
    } catch (error) {
      logger.error("Error updating trial class status", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.UPDATE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async submitMentorFeedback(
    trialClassId: string,
    mentorId: string,
    _feedback: { rating: number; comment?: string }
  ): Promise<TrialClassResponseDto> {
    try {
      const trial = await this.trialRepo.findById(trialClassId);
      if (!trial) throw new AppError(MESSAGES.TRIAL_CLASS.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      const trialMentorId = this.getStringId(trial.mentor);
      if (!trialMentorId || trialMentorId !== mentorId) {
        throw new AppError(MESSAGES.TRIAL_CLASS.ACCESS_DENIED, HttpStatusCode.FORBIDDEN);
      }

      const updatedTrial = await this.trialRepo.updateTrial(trialClassId, { status: "completed" } as unknown as Partial<ITrialClassDocument>);
      if (!updatedTrial) throw new AppError(MESSAGES.TRIAL_CLASS.FEEDBACK_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);

      return TrialClassMapper.toResponseDto(updatedTrial);
    } catch (error) {
      logger.error("Error submitting mentor feedback", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.FEEDBACK_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }


  private async validateSubjectExists(subjectId: string): Promise<void> {
    const { Subject } = await import("../models/subject.model.js");
    const subject = await Subject.findById(subjectId);

    if (!subject) throw new AppError(MESSAGES.ADMIN.COURSE_NOT_FOUND, HttpStatusCode.BAD_REQUEST);
    if (!subject.isActive) throw new AppError(MESSAGES.ADMIN.COURSE_NOT_AVAILABLE, HttpStatusCode.BAD_REQUEST);
  }

  // Helper to get day name from date
  private getDayName(date: Date): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[date.getDay()] || '';
  }

  // Get conflicts for a mentor on a specific date
  private async getConflicts(mentorId: string, date: string): Promise<string[]> {
    const dateObj = new Date(date);
    const dayOfWeek = this.getDayName(dateObj);
    
    // Get courses on this day of week
    const courses = await this.courseRepo.findByMentor(mentorId) as any[];
    const courseSlotsOnDay = courses
      .filter((c) => c.schedule?.days?.includes(dayOfWeek))
      .map((c) => c.schedule.timeSlot)
      .filter((slot: string | undefined): slot is string => !!slot);
    
    // Get trial classes on this specific date - ONLY active ones
    const trials = await this.trialRepo.findByMentorId(mentorId);
    const trialSlots = trials
      .filter((t) => 
        new Date(t.preferredDate).toDateString() === dateObj.toDateString() &&
        ['requested', 'assigned'].includes(t.status)
      )
      .map((t) => t.preferredTime)
      .filter((slot: string | undefined): slot is string => !!slot);
    
    return [...courseSlotsOnDay, ...trialSlots];
  }

  // Get available time slots aggregated across all mentors
  async getAvailableSlots(subjectId: string, date: string): Promise<Record<string, unknown>> {
    try {
      const dateObj = new Date(date);
      const dayOfWeek = this.getDayName(dateObj);
      
      // Resolve Subject
      const { Subject } = await import("../models/subject.model.js");
      let subject: import('../models/subject.model.js').ISubject | null;
      
      if (Types.ObjectId.isValid(subjectId)) {
        subject = await Subject.findById(subjectId);
      } else {
        // Fallback for name-based lookup
        subject = await Subject.findOne({ 
          subjectName: { $regex: new RegExp(`^${subjectId.trim()}$`, "i") } 
        });
      }

      if (!subject) throw new AppError(MESSAGES.ADMIN.COURSE_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      
      const mentors = await this.mentorRepo.findBySubjectProficiency(subject.subjectName);
      logger.info(`Found ${mentors.length} mentors for subject ${subject.subjectName}`);
      
      // Aggregate slots across all mentors
      const slotMap = new Map<string, number>();
      
      for (const mentor of mentors) {
        const daySchedule = mentor.availability?.find((a) => a.day === dayOfWeek);
        if (!daySchedule?.slots) continue;
        
        const conflicts = await this.getConflicts(mentor._id.toString(), date);
        
        for (const slot of daySchedule.slots) {
          if (!slot.startTime || !slot.endTime) continue; // Skip invalid slots
          const slotKey = `${slot.startTime}-${slot.endTime}`;
          
          // Skip if this specific slot has a conflict
          if (conflicts.includes(slotKey)) continue;
          
          // Increment mentor count for this slot
          slotMap.set(slotKey, (slotMap.get(slotKey) || 0) + 1);
        }
      }
      
      // Convert to array and sort
      const availableSlots = Array.from(slotMap.entries())
        .map(([slot, count]) => {
          const [startTime, endTime] = slot.split('-');
          return { startTime, endTime, mentorCount: count };
        })
        .filter(slot => slot.mentorCount > 0 && slot.startTime && slot.endTime)
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
      
      logger.info(`Found ${availableSlots.length} available time slots on ${date}`);
      
      if (availableSlots.length === 0) {
        return {
          hasAvailability: false,
          date,
          dayOfWeek,
          subject: subject.subjectName,
          slots: [],
          message: MESSAGES.TRIAL_CLASS.NO_MENTORS_AVAILABLE
        };
      }
      
      return {
        hasAvailability: true,
        date,
        dayOfWeek,
        subject: subject.subjectName,
        slots: availableSlots
      };
    } catch (error) {
      logger.error("Error getting available slots", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.FETCH_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  // Auto-assign best available mentor
  async autoAssignMentor(subjectId: string, date: string, timeSlot: string): Promise<import('../interfaces/models/mentor.interface.js').MentorProfile> {
    try {
      const dateObj = new Date(date);
      const dayOfWeek = this.getDayName(dateObj);
      
      const { Subject } = await import("../models/subject.model.js");
      const subject = await Subject.findById(subjectId);
      if (!subject) throw new AppError(MESSAGES.ADMIN.COURSE_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      
      // Get mentors with this subject proficiency
      const mentors = await this.mentorRepo.findBySubjectProficiency(subject.subjectName);
      
      // Filter to those available at this time with no conflicts
      const available = [];
      for (const mentor of mentors) {
        const daySchedule = mentor.availability?.find((a) => a.day === dayOfWeek);
        if (!daySchedule?.slots) continue;
        
        const hasSlot = daySchedule.slots.some((s) => 
          `${s.startTime}-${s.endTime}` === timeSlot
        );
        if (!hasSlot) continue;
        
        // Check conflicts
        const conflicts = await this.getConflicts(mentor._id.toString(), date);
        if (conflicts.includes(timeSlot)) continue;
        
        available.push(mentor);
      }
      
      if (available.length === 0) {
        throw new AppError(
          MESSAGES.TRIAL_CLASS.NO_MENTORS_AVAILABLE,
          HttpStatusCode.NOT_FOUND
        );
      }
      
      // Pick best mentor using smart criteria
      const best = available.sort((a, b) => {
        // Criteria 1: Highest rating
        if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
        
        // Criteria 2: Least weekly bookings (balance workload)
        if ((a.currentWeeklyBookings || 0) !== (b.currentWeeklyBookings || 0)) 
          return (a.currentWeeklyBookings || 0) - (b.currentWeeklyBookings || 0);
        
        // Criteria 3: Most total ratings (experience)
        return (b.totalRatings || 0) - (a.totalRatings || 0);
      })[0];
      
      if (!best) {
          throw new AppError(MESSAGES.TRIAL_CLASS.NO_MENTORS_AVAILABLE, HttpStatusCode.NOT_FOUND);
      }
      
      logger.info(`Auto-assigned mentor ${best._id} (rating: ${best.rating}) for ${subject.subjectName} trial class`);
      return best;
    } catch (error) {
      logger.error("Error auto-assigning mentor", error);
      throw error instanceof AppError ? error : new AppError(MESSAGES.TRIAL_CLASS.ASSIGN_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}