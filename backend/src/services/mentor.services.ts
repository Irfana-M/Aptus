import { injectable, inject } from 'inversify';
import type {
  IMentorRepository,
} from "../interfaces/repositories/IMentorRepository";
import type { ITrialClassRepository } from "../interfaces/repositories/ITrialClassRepository";
import type { IMentorAuthRepository } from '@/interfaces/repositories/IMentorAuthRepository';
import type { AuthUser } from "../interfaces/auth/auth.interface";
import type { IEmailService } from "../interfaces/services/IEmailService";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import type { IMentorService } from "../interfaces/services/IMentorService";
import type { ISessionRepository } from '../interfaces/repositories/ISessionRepository';
import type { ISchedulingService } from '../interfaces/services/ISchedulingService';
import type { ICourseRepository } from '../interfaces/repositories/ICourseRepository';
import type { IMentorAvailabilityRepository } from '../interfaces/repositories/IMentorAvailabilityRepository';
import type { ITimeSlotRepository } from '../interfaces/repositories/ITimeSlotRepository';
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { uploadFileToS3 } from "../utils/s3Upload";
import { TYPES } from '../types';
import mongoose from "mongoose";
import { MESSAGES } from '../constants/messages.constants';
import type { RegisterUserDto } from '@/dtos/auth/RegisteruserDTO';
import type { MentorResponseDto } from '@/dtos/mentor/MentorResponseDTO';
import { MentorMapper } from '@/mappers/MentorMapper';
import { TrialClassMapper } from '@/mappers/trialClassMapper';
import type { TrialClassResponseDto } from "@/dtos/student/trialClassDTO";
import { AppError } from '../utils/AppError';
import { HttpStatusCode } from '../constants/httpStatus';
import { MENTOR_LEAVE_CUTOFF_HOURS } from '../config/leavePolicy.config';

import type { ILeavePolicyService } from '../interfaces/services/ILeavePolicyService';
import { LEAVE_STATUS } from '../constants/status.constants';
import { DomainEvent } from '../constants/events';
import type { InternalEventEmitter } from '../utils/InternalEventEmitter';
import type { LeaveEntry } from '../interfaces/models/mentor.interface';
import { StatusLogger } from '../utils/statusLogger';
import type { LeavePaginatedResult } from '../interfaces/repositories/IMentorRepository';

@injectable()
export class MentorService implements IMentorService {
  constructor(
    @inject(TYPES.IMentorAuthRepository) private _mentorAuthRepo: IMentorAuthRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.ITrialClassRepository) private _trialClassRepo: ITrialClassRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
    @inject(TYPES.ISchedulingService) private _schedulingService: ISchedulingService,
    @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
    @inject(TYPES.ICourseRepository) private _courseRepo: ICourseRepository,
    @inject(TYPES.IMentorAvailabilityRepository) private _mentorAvailabilityRepo: IMentorAvailabilityRepository,
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.ILeavePolicyService) private _leavePolicyService: ILeavePolicyService,
    @inject(TYPES.InternalEventEmitter) private _eventEmitter: InternalEventEmitter
  ) {}


  async registerMentor(data: RegisterUserDto): Promise<AuthUser> {
    try {
      logger.info(`Registering new mentor with email: ${data.email}`);

      const existingMentor = await this._mentorAuthRepo.findByEmail(data.email);
      if (existingMentor) {
        logger.warn(
          `Mentor registration failed - Email already exists: ${data.email}`
        );
        throw new Error(MESSAGES.AUTH.USER_EXISTS);
      }

      const mentor = await this._mentorAuthRepo.createUser(data);
      logger.info(`Mentor registered successfully: ${mentor.email}`);

      return mentor;
    } catch (error: unknown) {
      logger.error(
        `Error in registerMentor for email ${data.email}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async updateMentorProfile(
    mentorId: string,
    data: Record<string, unknown> & Partial<MentorProfile>
  ): Promise<MentorProfile> {
    try {
      logger.info(`Starting profile update for mentor: ${mentorId}`);

      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) {
        logger.error(`Mentor not found for profile update: ${mentorId}`);
        throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);
      }

      const updateData: Partial<MentorProfile> = {} as Partial<MentorProfile>;
      
      if (data.fullName !== undefined) updateData.fullName = data.fullName as string;
      if (data.email !== undefined) updateData.email = data.email as string;
      if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber as string;
      if (data.location !== undefined) updateData.location = data.location as string;
      if (data.bio !== undefined) updateData.bio = data.bio as string;
      
      if (data.isProfileComplete !== undefined) {
          updateData.isProfileComplete = typeof data.isProfileComplete === "string" 
            ? data.isProfileComplete === "true" 
            : !!data.isProfileComplete;
      } else if (mentor.isProfileComplete !== undefined) {
          updateData.isProfileComplete = mentor.isProfileComplete;
      }

      logger.debug(`Processing update data for mentor: ${mentorId}`, {
        updateData,
      });

      if (data.academicQualifications) {
        try {
          updateData.academicQualifications =
            typeof data.academicQualifications === "string"
              ? JSON.parse(data.academicQualifications)
              : data.academicQualifications;
          logger.debug(
            `Processed academic qualifications for mentor: ${mentorId}`
          );
        } catch (parseError) {
          logger.error(
            `Error parsing academicQualifications for mentor ${mentorId}: ${parseError}`
          );
          throw new Error(MESSAGES.VALIDATION.FAILED);
        }
      }

      if (data.experiences) {
        try {
          updateData.experiences =
            typeof data.experiences === "string"
              ? JSON.parse(data.experiences)
              : data.experiences;
          logger.debug(`Processed experiences for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing experiences for mentor ${mentorId}: ${parseError}`
          );
          throw new Error(MESSAGES.VALIDATION.FAILED);
        }
      }

      if (data.subjectProficiency) {
        try {
          updateData.subjectProficiency =
            typeof data.subjectProficiency === "string"
              ? JSON.parse(data.subjectProficiency)
              : data.subjectProficiency;
          logger.debug(`Processed subject proficiency for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing subjectProficiency for mentor ${mentorId}: ${parseError}`
          );
          throw new Error(MESSAGES.VALIDATION.FAILED);
        }
      }

      if (data.certification) {
        try {
          updateData.certification =
            typeof data.certification === "string"
              ? JSON.parse(data.certification)
              : data.certification;
          logger.debug(`Processed certifications for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing certification for mentor ${mentorId}: ${parseError}`
          );
          throw new Error(MESSAGES.VALIDATION.FAILED);
        }
      }

      if (data.availability) {
        try {
          updateData.availability =
            typeof data.availability === "string"
              ? JSON.parse(data.availability)
              : data.availability;
          logger.debug(`Processed availability for mentor: ${mentorId}`);
        } catch (parseError) {
          logger.error(
            `Error parsing availability for mentor ${mentorId}: ${parseError}`
          );
          throw new Error(MESSAGES.VALIDATION.FAILED);
        }
      }

      if (data.profilePicture) {
        try {
          updateData.profilePicture = await this.handleProfilePictureUpload(
            data.profilePicture as unknown as { originalname: string; mimetype: string; size: number }
          );
          logger.debug(`Processed profile picture for mentor: ${mentorId}`);
        } catch (uploadError: unknown) {
          logger.error(
            `Error uploading profile picture for mentor ${mentorId}: ${getErrorMessage(uploadError)}`
          );
          throw new Error(MESSAGES.ADMIN.UPDATE_FAILED);
        }
      }

      const updatedMentor = await this._mentorRepo.updateProfile(
        mentorId,
        updateData
      );
      if (!updatedMentor) {
        logger.error(
          `Failed to update mentor profile in repository: ${mentorId}`
        );
        throw new Error(MESSAGES.ADMIN.UPDATE_FAILED);
      }

      logger.info(`Mentor profile updated successfully: ${mentorId}`);
      return updatedMentor;
    } catch (error: unknown) {
      logger.error(
        `Error in updateMentorProfile for mentor ${mentorId}: ${getErrorMessage(error)}`
      );
      throw new Error(`Failed to update mentor profile: ${getErrorMessage(error)}`);
    }
  }

  async submitProfileForApproval(
    mentorId: string,
    _requestingUserId: string
  ): Promise<{ message: string }> {
    const mentor = await this._mentorRepo.findById(mentorId);
    if (!mentor) throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);
    if (!mentor.isProfileComplete)
      throw new Error(MESSAGES.MENTOR.PROFILE_INCOMPLETE);

    await this._mentorRepo.submitForApproval(mentorId);

    return { message: MESSAGES.MENTOR.PROFILE_SUBMITTED };
  }

  async getPendingMentors() {
    return this._mentorRepo.getPendingApprovals();
  }

  async approveMentor(
    mentorId: string,
    adminId: string
  ): Promise<{ message: string }> {
    try {
      logger.info(`Approving mentor - Mentor: ${mentorId}, Admin: ${adminId}`);

      const updatedMentor = await this._mentorRepo.updateApprovalStatus(
        mentorId,
        "approved"
      );
      if (!updatedMentor) {
        logger.error(`Mentor not found for approval: ${mentorId}`);
        throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);
      }

      // Normalization of availability: One-time migration after approval
      try {
        await this.normalizeMentorAvailability(mentorId);
        logger.info(`Availability normalized for mentor: ${mentorId}`);
      } catch (normError: unknown) {
        logger.error(`Failed to normalize availability for mentor ${mentorId}: ${getErrorMessage(normError)}`);
      }

      try {
        await this._emailService.sendMail(
          updatedMentor.email,
          "Aptus - Your Mentor Profile is Approved",
          `<p>Hi ${updatedMentor.fullName},</p>
          <p>Congratulations — your mentor profile has been approved by our admin team.</p>
          <p>You can now access all mentor features and start helping students.</p>
          <br>
          <p>Best regards,<br>The Aptus Team</p>`
        );
        logger.info(
          `Approval email sent successfully to: ${updatedMentor.email}`
        );
      } catch (emailError: unknown) {
        logger.warn(
          `Failed to send approval email to ${updatedMentor.email}: ${getErrorMessage(emailError)}`
        );
      }

      logger.info(`Mentor approved successfully: ${mentorId}`);
      return { message: MESSAGES.ADMIN.UPDATE_SUCCESS };
    } catch (error: unknown) {
      logger.error(
        `Error in approveMentor for mentor ${mentorId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async rejectMentor(
    mentorId: string,
    reason: string,
    adminId: string
  ): Promise<{ message: string }> {
    try {
      logger.info(
        `Rejecting mentor - Mentor: ${mentorId}, Admin: ${adminId}, Reason: ${reason}`
      );

      const updatedMentor = await this._mentorRepo.updateApprovalStatus(
        mentorId,
        "rejected",
        reason
      );
      if (!updatedMentor) {
        logger.error(`Mentor not found for rejection: ${mentorId}`);
        throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);
      }

      try {
        await this._emailService.sendMail(
          updatedMentor.email,
          "Aptus - Mentor Profile Review Update",
          `<p>Hi ${updatedMentor.fullName},</p>
          <p>Thank you for submitting your mentor profile for review.</p>
          <p>After careful consideration, we are unable to approve your profile at this time.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please review your profile, make the necessary updates, and resubmit for approval.</p>
          <br>
          <p>Best regards,<br>The Aptus Team</p>`
        );
        logger.info(
          `Rejection email sent successfully to: ${updatedMentor.email}`
        );
      } catch (emailError: unknown) {
        logger.warn(
          `Failed to send rejection email to ${updatedMentor.email}: ${getErrorMessage(emailError)}`
        );
      }

      logger.info(`Mentor rejected successfully: ${mentorId}`);
      return { message: MESSAGES.ADMIN.UPDATE_SUCCESS };
    } catch (error: unknown) {
      logger.error(
        `Error in rejectMentor for mentor ${mentorId}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  private async handleProfilePictureUpload(file: { originalname: string; mimetype: string; size: number }): Promise<string> {
    try {
      logger.debug("Handling profile picture upload:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      if (!file) throw new Error(MESSAGES.VALIDATION.FAILED);

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(MESSAGES.VALIDATION.FAILED);
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error(MESSAGES.VALIDATION.FAILED);

      const imageUrl = await uploadFileToS3(file as unknown as Express.Multer.File);

      logger.info(`Profile picture uploaded successfully to S3: ${imageUrl}`);
      return imageUrl;
    } catch (error: unknown) {
      logger.error(`Error uploading profile picture: ${getErrorMessage(error)}`);
      throw new Error(MESSAGES.ADMIN.UPDATE_FAILED);
    }
  }

  async getMentorTrialClasses(mentorId: string, page: number = 1, limit: number = 10): Promise<{ items: TrialClassResponseDto[]; total: number }> {
    try {
      logger.info(`Fetching trial classes for mentor: ${mentorId}, page: ${page}, limit: ${limit}`);
      const skip = (page - 1) * limit;
      const [trialClasses, total] = await Promise.all([
        this._trialClassRepo.findByMentorId(mentorId, skip, limit),
        this._trialClassRepo.countByMentorId(mentorId)
      ]);
      return {
        items: trialClasses.map(token => TrialClassMapper.toResponseDto(token)),
        total
      };
    } catch (error: unknown) {
      logger.error(`Error in getMentorTrialClasses for mentor ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getMentorDailySessions(mentorId: string, date: Date): Promise<unknown[]> {
    try {
      logger.info(`Fetching daily sessions for mentor: ${mentorId} on ${date}`);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const [sessions, trialClasses] = await Promise.all([
        this._sessionRepo.findTodayByMentor(mentorId, date),
        this._trialClassRepo.findTodayTrialClasses(mentorId)
      ]);

      const formattedSessions = sessions.map(session => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (session as any)._id.toString(),
        type: 'regular',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subject: (session.subjectId as any).subjectName || 'Subject',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentName: (session.studentId as any)?.fullName || ((session.participants && session.participants.find((participant: any) => participant.role === 'student')?.userId) as any)?.fullName || 'Student',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentImage: (session.studentId as any)?.profileImage || ((session.participants && session.participants.find((participant: any) => participant.role === 'student')?.userId) as any)?.profileImage || '',
        startTime: session.startTime,
        endTime: session.endTime,
        status: session.status,
        meetLink: session.webRTCId ? `/meet/${session.webRTCId}` : undefined // Assuming webRTCId is used for link
      }));

      const formattedTrials = trialClasses.map(trial => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (trial as any)._id.toString(),
        type: 'trial',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subject: (trial.subject as any).subjectName || 'Trial Subject',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentName: (trial.student as any).fullName || 'Trial Student',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentImage: (trial.student as any).profilePicture || '',
        // Trial classes store preferredTime as string "HH:MM", construct Date
        startTime: this._combineDateAndTime(trial.preferredDate, trial.preferredTime),
        endTime: this._combineDateAndTime(trial.preferredDate, trial.preferredTime, 60), // Assume 1 hour for trial
        status: trial.status,
        meetLink: trial.meetLink
      }));

      const combined = [...formattedSessions, ...formattedTrials].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      return combined;
    } catch (error: unknown) {
      logger.error(`Error in getMentorDailySessions for mentor ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private _combineDateAndTime(date: Date, timeStr: string, durationMinutes: number = 0): Date {
      const d = new Date(date);
      const timeParts = timeStr.split(':').map(Number);
      const hours = timeParts[0] ?? 0;
      const minutes = timeParts[1] ?? 0;
      d.setHours(hours, minutes, 0, 0);
      if (durationMinutes > 0) {
          d.setMinutes(d.getMinutes() + durationMinutes);
      }
      return d;
  }

   async getById(id: string): Promise<MentorResponseDto | null> {
    const mentor = await this._mentorRepo.findById(id);
    if (!mentor) return null;
    return MentorMapper.toResponseDto(mentor);
  }

  async getMentorProfile(mentorId: string): Promise<MentorProfile | null> {
    try {
      logger.info(`Fetching mentor profile via service: ${mentorId}`);
      const mentor = await this._mentorRepo.getProfileWithImage(mentorId);
      return mentor;
    } catch (error: unknown) {

      logger.error(`Error in getMentorProfile service: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async normalizeMentorAvailability(mentorId: string): Promise<void> {
    try {
      logger.info(`Normalizing availability for mentor: ${mentorId}`);
      
      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);

      if (!mentor.availability || mentor.availability.length === 0) {
        logger.info(`No availability found to normalize for mentor: ${mentorId}`);
        return;
      }

      const dayMap: { [key: string]: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' } = {
        'monday': 'Monday',
        'tuesday': 'Tuesday',
        'wednesday': 'Wednesday',
        'thursday': 'Thursday',
        'friday': 'Friday',
        'saturday': 'Saturday',
        'sunday': 'Sunday'
      };

      for (const avail of mentor.availability) {
        const dayOfWeek = dayMap[avail.day.toLowerCase()];
        if (!dayOfWeek) {
          logger.warn(`Invalid day of week found in normalization: ${avail.day}`);
          continue;
        }

        const slots = avail.slots.map((slot: import('../interfaces/models/mentor.interface').TimeSlot) => ({
          startTime: slot.startTime,
          endTime: slot.endTime
        }));

        await this._mentorAvailabilityRepo.findOneAndUpdate(
          { mentorId: new mongoose.Types.ObjectId(mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId, dayOfWeek },
          { slots, isActive: true },
          { upsert: true, new: true }
        );
      }

      // One-time cleanup: Clear embedded availability to maintain single source of truth
      await this._mentorRepo.updateProfile(mentorId, { availability: [] });
      
      logger.info(`Normalization completed and embedded availability cleared for: ${mentorId}`);
    } catch (error: unknown) {
      logger.error(`Error in normalizeMentorAvailability for ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }


  /**
   * Helper: Get start and end of week (Monday to Sunday) for a given date
   */
  private getWeekRange(date: Date): { startOfWeek: Date; endOfWeek: Date } {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  }

  /**
   * Get mentor's available time slots filtered by:
   * 1. Their configured availability
   * 2. 5 sessions/day limit (maxSessionsPerDay)
   * 3. 25 sessions/week limit (maxSessionsPerWeek)
   * 4. Existing booked slots (TimeSlot checks)
   * 5. Existing assigned trial classes (TrialClass checks)
   */
  async getMentorAvailableSlots(mentorId: string): Promise<{
    day: string;
    date: string;
    slots: { _id?: string; startTime: string; endTime: string; remainingCapacity: number }[];
  }[]> {
    try {
      logger.info(`Fetching available slots for mentor: ${mentorId} (21-day window)`);
      
      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) throw new Error(MESSAGES.AUTH.USER_NOT_FOUND);

      const maxSessionsPerDay = mentor.maxSessionsPerDay || 5;
      const maxSessionsPerWeek = mentor.maxSessionsPerWeek || 25;

      const availabilityRecords = await this._mentorAvailabilityRepo.find({
        mentorId: new mongoose.Types.ObjectId(mentorId.toString()) as any,
        isActive: true
      });

      const availabilityData = availabilityRecords.length > 0 
        ? availabilityRecords.map(r => ({ day: r.dayOfWeek, slots: r.slots }))
        : (mentor.availability || []);

      const result: { day: string, date: string, slots: any[] }[] = [];
      const now = new Date();
      const threeWeeksLater = new Date(now);
      threeWeeksLater.setDate(now.getDate() + 21);

      // Pre-fetch all relevant data for the 21-day window to avoid N+1 queries
      const [allTimeSlots, allTrialClasses] = await Promise.all([
        this._timeSlotRepo.find({
          mentorId: mentorId,
          startTime: { $gte: new Date(now.setHours(0,0,0,0)), $lte: threeWeeksLater }
        } as any),
        this._trialClassRepo.find({
           mentor: mentorId,
           preferredDate: { $gte: new Date(now.setHours(0,0,0,0)), $lte: threeWeeksLater },
           status: 'assigned'
        } as any)
      ]);

      const nowTime = new Date().getTime();
      const MIN_RESCHEDULE_NOTICE_MS = 2 * 60 * 60 * 1000; // 2 hours

      // Loop through 3 weeks
      for (let week = 0; week < 3; week++) {
        for (const dayAvail of availabilityData) {
          const nextDate = this.getNextDayOccurrence(dayAvail.day, week);
          const dateStr = nextDate.toLocaleDateString('sv-SE');
          
          const startOfDay = new Date(nextDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(nextDate);
          endOfDay.setHours(23, 59, 59, 999);

          // 1. Daily Usage Check
          const bookedTimeSlotsDaily = allTimeSlots.filter(ts => 
            new Date(ts.startTime) >= startOfDay && 
            new Date(ts.startTime) <= endOfDay &&
            ['booked', 'reserved'].includes(ts.status as string)
          );

          const assignedTrialsDaily = allTrialClasses.filter(trial =>
            new Date(trial.preferredDate) >= startOfDay && 
            new Date(trial.preferredDate) <= endOfDay
          );

          const dailyUsage = bookedTimeSlotsDaily.length + assignedTrialsDaily.length;
          const remainingDailyCapacity = Math.max(0, maxSessionsPerDay - dailyUsage);

          // 2. Weekly Usage Check
          const { startOfWeek, endOfWeek } = this.getWeekRange(nextDate);
          const bookedTimeSlotsWeekly = allTimeSlots.filter(ts =>
            new Date(ts.startTime) >= startOfWeek && 
            new Date(ts.startTime) <= endOfWeek &&
            ['booked', 'reserved'].includes(ts.status as string)
          ).length;

          const assignedTrialsWeekly = allTrialClasses.filter(trial =>
            new Date(trial.preferredDate) >= startOfWeek && 
            new Date(trial.preferredDate) <= endOfWeek
          ).length;

          const weeklyUsage = bookedTimeSlotsWeekly + assignedTrialsWeekly;
          const remainingWeeklyCapacity = Math.max(0, maxSessionsPerWeek - weeklyUsage);

          const effectiveCapacity = Math.min(remainingDailyCapacity, remainingWeeklyCapacity);
          if (effectiveCapacity <= 0) continue;

          // 3. Occupied Ranges
          const occupiedRanges = new Set<string>();
          for (const ts of bookedTimeSlotsDaily) {
            const range = `${new Date(ts.startTime).toTimeString().substring(0, 5)}-${new Date(ts.endTime).toTimeString().substring(0, 5)}`;
            occupiedRanges.add(range);
          }
          assignedTrialsDaily.forEach(trial => {
            if (trial.preferredTime) occupiedRanges.add(trial.preferredTime);
          });

          // 4. Collect Slots
          const daySlots: any[] = [];
          for (const slot of dayAvail.slots || []) {
            const slotRange = `${slot.startTime}-${slot.endTime}`;
            if (occupiedRanges.has(slotRange)) continue;

            // Same-day future check (Robust local construction)
            const [hStr, mStr] = slot.startTime.split(':');
            const h = parseInt(hStr || '0');
            const m = parseInt(mStr || '0');
            const slotStartDateTime = new Date(nextDate);
            slotStartDateTime.setHours(h, m, 0, 0);
            
            if (slotStartDateTime.getTime() < nowTime + MIN_RESCHEDULE_NOTICE_MS) continue;

            // Find matching TimeSlot document ID
            const matchingDoc = allTimeSlots.find(ts => {
               const docDateStr = new Date(ts.startTime).toLocaleDateString('sv-SE');
               return docDateStr === dateStr &&
                      new Date(ts.startTime).toTimeString().substring(0, 5) === slot.startTime && 
                      ts.status === 'available';
            });
            
            daySlots.push({
              _id: (matchingDoc as any)?._id?.toString(),
              startTime: slot.startTime,
              endTime: slot.endTime,
              remainingCapacity: effectiveCapacity
            });
          }

          if (daySlots.length > 0) {
            const existingEntry = result.find(r => r.day === dayAvail.day);
            if (existingEntry) {
              // Merge slots to provide a complete picture of recurring availability
              for (const newSlot of daySlots) {
                const alreadyExists = existingEntry.slots.some((s: any) => s.startTime === newSlot.startTime);
                if (!alreadyExists) {
                  existingEntry.slots.push(newSlot);
                }
              }
              // Keep slots sorted by time
              existingEntry.slots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime));
            } else {
              result.push({
                day: dayAvail.day,
                date: dateStr as string,
                slots: daySlots
              });
            }
          }
        }
      }

      // Sort by date
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      logger.info(`Found available slots across ${result.length} days for mentor ${mentorId}`);
      return result as any;
    } catch (error: unknown) {
      logger.error(`Error in getMentorAvailableSlots for ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async requestLeave(mentorId: string, startDate: Date, endDate: Date, reason?: string): Promise<void> {
    try {
      logger.info(`Mentor ${mentorId} requesting leave from ${startDate} to ${endDate}`);
      
      // 1. Validate using policy service
      await this._leavePolicyService.validateLeaveRequest(mentorId, startDate, endDate);

      // 2. Prepare leave data
      const leaveData = {
        startDate,
        endDate,
        approved: false,
        status: LEAVE_STATUS.PENDING,
        ...(reason !== undefined && { reason })
      };

      // 3. Persist
      await this._mentorRepo.addLeave(mentorId, leaveData);
      
      StatusLogger.logLeaveStatusChange(mentorId, "NEW_LEAVE", "NONE", LEAVE_STATUS.PENDING, mentorId);

      // 4. Emit event for orchestration (Step 1 requirement)
      this._eventEmitter.emit(DomainEvent.MENTOR_LEAVE_REQUESTED, { mentorId, startDate, endDate, reason });

    } catch (error: unknown) {
      logger.error(`Error in requestLeave: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async approveLeave(mentorId: string, leaveId: string, adminId: string): Promise<void> {
    try {
      let effectiveMentorId = mentorId;
      if (!effectiveMentorId) {
          const mentor = await this._mentorRepo.findByLeaveId(leaveId);
          if (!mentor) throw new AppError(MESSAGES.MENTOR.NOT_FOUND, HttpStatusCode.NOT_FOUND);
          effectiveMentorId = (mentor as any)._id.toString();
      }

      logger.info(`Admin ${adminId} approving leave ${leaveId} for mentor ${effectiveMentorId}`);
      
      const mentor = await this._mentorRepo.findById(effectiveMentorId);
      if (!mentor || !mentor.leaves) throw new AppError(MESSAGES.MENTOR.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      const leave = mentor.leaves.find((l: any) => (l as unknown as { _id: mongoose.Types.ObjectId })._id.toString() === leaveId);
      if (!leave) throw new AppError(MESSAGES.MENTOR.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      // Rule: status === LEAVE_STATUS.PENDING
      if (leave.status !== LEAVE_STATUS.PENDING) {
          throw new AppError("Leave request is already processed", HttpStatusCode.CONFLICT);
      }

      const updateData: Partial<LeaveEntry> = {
          status: LEAVE_STATUS.APPROVED,
          approved: true,
          approvedBy: adminId,
          approvedAt: new Date()
      };

      await this._mentorRepo.updateLeaveStatus(effectiveMentorId, leaveId, updateData);
      
      StatusLogger.logLeaveStatusChange(effectiveMentorId, leaveId, leave.status, LEAVE_STATUS.APPROVED, adminId);

      // Emit domain event: MentorLeaveApprovedEvent (Internal Event)
      this._eventEmitter.emit(DomainEvent.MENTOR_LEAVE_APPROVED, { mentorId: effectiveMentorId, leaveId, startDate: leave.startDate, endDate: leave.endDate });

      logger.info(`Leave ${leaveId} approved for mentor ${effectiveMentorId}`);
    } catch (error: unknown) {
      logger.error(`Error in approveLeave: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async rejectLeave(mentorId: string | undefined, leaveId: string, adminId: string, reason: string): Promise<void> {
    try {
      let effectiveMentorId: string;
      if (!mentorId) {
          const mentor = await this._mentorRepo.findByLeaveId(leaveId);
          if (!mentor) throw new AppError(MESSAGES.MENTOR.NOT_FOUND, HttpStatusCode.NOT_FOUND);
          effectiveMentorId = (mentor as any)._id.toString();
      } else {
          effectiveMentorId = mentorId;
      }

      logger.info(`Admin ${adminId} rejecting leave ${leaveId} for mentor ${effectiveMentorId}`);
      
      const mentor = await this._mentorRepo.findById(effectiveMentorId);
      if (!mentor || !mentor.leaves) throw new AppError(MESSAGES.MENTOR.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      const leave = mentor.leaves.find((l: any) => (l as unknown as { _id: mongoose.Types.ObjectId })._id.toString() === leaveId);
      if (!leave) throw new AppError(MESSAGES.MENTOR.NOT_FOUND, HttpStatusCode.NOT_FOUND);

      if (leave.status !== LEAVE_STATUS.PENDING) {
          throw new AppError("Leave request is already processed", HttpStatusCode.CONFLICT);
      }

      const updateData: Partial<LeaveEntry> = {
          status: LEAVE_STATUS.REJECTED,
          approved: false,
          rejectionReason: reason
      };

      await this._mentorRepo.updateLeaveStatus(effectiveMentorId, leaveId, updateData);

      StatusLogger.logLeaveStatusChange(effectiveMentorId, leaveId, leave.status, LEAVE_STATUS.REJECTED, adminId);

      this._eventEmitter.emit(DomainEvent.MENTOR_LEAVE_REJECTED, { mentorId: effectiveMentorId, leaveId, reason });

      logger.info(`Leave ${leaveId} rejected for mentor ${effectiveMentorId}`);
    } catch (error: unknown) {
      logger.error(`Error in rejectLeave: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private getNextDayOccurrence(dayName: string, weekOffset: number = 0): Date {
    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const targetDay = dayMap[dayName] ?? 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start at midnight for calculation
    const currentDay = today.getDay();
    
    let daysUntil = targetDay - currentDay;
    if (daysUntil < 0) daysUntil += 7; // Target is next week
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntil + (weekOffset * 7));
    return targetDate;
  }

  // Get only one-to-one students for a mentor
  async getOneToOneStudents(mentorId: string): Promise<unknown[]> {
    try {
      logger.info(`Fetching one-to-one students for mentor: ${mentorId}`);
      const students = await this._courseRepo.findOneToOneByMentor(mentorId);
      return students;
    } catch (error: unknown) {
      logger.error(`Error in getOneToOneStudents for mentor ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  // Get only group batches for a mentor
  async getGroupBatches(mentorId: string): Promise<unknown[]> {
    try {
      logger.info(`Fetching group batches for mentor: ${mentorId}`);
      const batches = await this._courseRepo.findGroupBatchesByMentor(mentorId);
      return batches;
    } catch (error: unknown) {
      logger.error(`Error in getGroupBatches for mentor ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getMentorUpcomingSessionsWithEligibility(mentorId: string): Promise<{ sessions: unknown[], leaveWindowOpen: boolean }> {
    try {
      logger.info(`Fetching upcoming sessions with eligibility for mentor: ${mentorId}`);
      
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);

      const [sessions, trialClasses] = await Promise.all([
        this._sessionRepo.findByMentorAndDateRange(mentorId, now, nextWeek),
        this._trialClassRepo.findAllPaginated({ limit: 100 }) // Simple fetch for now, can be optimized
      ]);

      // Filter trial classes for the next week and correct mentor
      const filteredTrials = (trialClasses.trialClasses || []).filter(trial => 
        trial.mentor?.toString() === mentorId && 
        trial.preferredDate >= now && 
        trial.preferredDate <= nextWeek &&
        trial.status === 'assigned'
      );

      const formattedSessions = sessions.map(session => {
        const startTime = new Date(session.startTime);
        const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: (session as any)._id?.toString() || (session as any).id,
          type: 'regular',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subject: (session.subjectId as any)?.subjectName || 'Subject',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          studentName: (session.studentId as any)?.fullName || 'Student',
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          canApplyLeave: diffInHours >= MENTOR_LEAVE_CUTOFF_HOURS
        };
      });

      const formattedTrials = filteredTrials.map(trial => {
        const startTime = this._combineDateAndTime(trial.preferredDate, trial.preferredTime);
        const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return {
          id: trial._id.toString(),
          type: 'trial',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          subject: (trial.subject as any)?.subjectName || 'Trial Subject',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          studentName: (trial.student as any)?.fullName || 'Trial Student',
          startTime: startTime,
          endTime: this._combineDateAndTime(trial.preferredDate, trial.preferredTime, 60),
          status: trial.status,
          canApplyLeave: diffInHours >= MENTOR_LEAVE_CUTOFF_HOURS
        };
      });

      const allSessions = [...formattedSessions, ...formattedTrials].sort((a, b) => 
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      // Eligibility Rule: Leave window is open if NO sessions start within the next 24 hours
      const hasSessionsInWindow = allSessions.some(s => {
          const startTime = new Date(s.startTime);
          const diffInHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
          return diffInHours >= 0 && diffInHours < MENTOR_LEAVE_CUTOFF_HOURS;
      });

      return {
        sessions: allSessions,
        leaveWindowOpen: !hasSessionsInWindow
      };

    } catch (error: unknown) {
      logger.error(`Error in getMentorUpcomingSessionsWithEligibility: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async getPaginatedLeaves(params: {
    page: number;
    limit: number;
    mentorId?: string;
    status?: LEAVE_STATUS | '';
  }): Promise<LeavePaginatedResult> {
    try {
      logger.info(`Fetching paginated leaves with params: ${JSON.stringify(params)}`);
      return await this._mentorRepo.getPaginatedLeaves(params);
    } catch (error: unknown) {
      logger.error(`Error in getPaginatedLeaves service: ${getErrorMessage(error)}`);
      throw error;
    }
  }
}

