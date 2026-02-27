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
import { Types } from 'mongoose';
import type { RegisterUserDto } from '@/dtos/auth/RegisteruserDTO';
import type { MentorResponseDto } from '@/dtos/mentor/MentorResponseDTO';
import { MentorMapper } from '@/mappers/MentorMapper';
import { TrialClassMapper } from '@/mappers/trialClassMapper';
import type { TrialClassResponseDto } from "@/dtos/student/trialClassDTO";

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
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository
  ) {}


  async registerMentor(data: RegisterUserDto): Promise<AuthUser> {
    try {
      logger.info(`Registering new mentor with email: ${data.email}`);

      const existingMentor = await this._mentorAuthRepo.findByEmail(data.email);
      if (existingMentor) {
        logger.warn(
          `Mentor registration failed - Email already exists: ${data.email}`
        );
        throw new Error("Mentor with this email already exists");
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
        throw new Error("Mentor not found");
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
          throw new Error("Invalid academic qualifications format");
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
          throw new Error("Invalid experiences format");
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
          throw new Error("Invalid subject proficiency format");
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
          throw new Error("Invalid certification format");
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
          throw new Error("Invalid availability format");
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
          throw new Error(
            `Failed to upload profile picture: ${getErrorMessage(uploadError)}`
          );
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
        throw new Error("Failed to update mentor profile");
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
    if (!mentor) throw new Error("Mentor not found");
    if (!mentor.isProfileComplete)
      throw new Error("Complete profile before submitting for approval");

    await this._mentorRepo.submitForApproval(mentorId);

    return { message: "Profile submitted for approval" };
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
        throw new Error("Mentor not found");
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
      return { message: "Mentor approved and notification sent" };
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
        throw new Error("Mentor not found");
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
      return { message: "Mentor rejected and notification sent" };
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

      if (!file) throw new Error("No file provided for profile picture");

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.mimetype}`);
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error("File too large (max 5MB)");

      const imageUrl = await uploadFileToS3(file as unknown as Express.Multer.File);

      logger.info(`Profile picture uploaded successfully to S3: ${imageUrl}`);
      return imageUrl;
    } catch (error: unknown) {
      logger.error(`Error uploading profile picture: ${getErrorMessage(error)}`);
      throw new Error(`Failed to upload profile picture: ${getErrorMessage(error)}`);
    }
  }

  async getMentorTrialClasses(mentorId: string): Promise<TrialClassResponseDto[]> {
    try {
      logger.info(`Fetching trial classes for mentor: ${mentorId}`);
      const trialClasses = await this._trialClassRepo.findByMentorId(mentorId);
      return trialClasses.map(token => TrialClassMapper.toResponseDto(token));
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

      const formattedSessions = sessions.map(s => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (s as any)._id.toString(),
        type: 'regular',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subject: (s.subjectId as any).subjectName || 'Subject',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentName: (s.studentId as any)?.fullName || ((s.participants && s.participants.find((p: any) => p.role === 'student')?.userId) as any)?.fullName || 'Student',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentImage: (s.studentId as any)?.profileImage || ((s.participants && s.participants.find((p: any) => p.role === 'student')?.userId) as any)?.profileImage || '',
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        meetLink: s.webRTCId ? `/meet/${s.webRTCId}` : undefined // Assuming webRTCId is used for link
      }));

      const formattedTrials = trialClasses.map(t => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (t as any)._id.toString(),
        type: 'trial',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subject: (t.subject as any).subjectName || 'Trial Subject',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentName: (t.student as any).fullName || 'Trial Student',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        studentImage: (t.student as any).profilePicture || '',
        // Trial classes store preferredTime as string "HH:MM", construct Date
        startTime: this._combineDateAndTime(t.preferredDate, t.preferredTime),
        endTime: this._combineDateAndTime(t.preferredDate, t.preferredTime, 60), // Assume 1 hour for trial
        status: t.status,
        meetLink: t.meetLink
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
      if (!mentor) throw new Error("Mentor not found for normalization");

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

        const slots = avail.slots.map(s => ({
          startTime: s.startTime,
          endTime: s.endTime
        }));

        await this._mentorAvailabilityRepo.findOneAndUpdate(
          { mentorId: new Types.ObjectId(mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId, dayOfWeek },
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
    slots: { startTime: string; endTime: string; remainingCapacity: number }[];
  }[]> {
    try {
      logger.info(`Fetching available slots for mentor: ${mentorId}`);
      
      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) throw new Error("Mentor not found");

      const maxSessionsPerDay = mentor.maxSessionsPerDay || 5;
      const maxSessionsPerWeek = mentor.maxSessionsPerWeek || 25;

      // Get mentor's availability from MentorAvailabilityModel
      const availabilityRecords = await this._mentorAvailabilityRepo.find({
        mentorId: new Types.ObjectId(mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
        isActive: true
      });

      const availabilityData = availabilityRecords.length > 0 
        ? availabilityRecords.map(r => ({ day: r.dayOfWeek, slots: r.slots }))
        : (mentor.availability || []);

      const result: { day: string; slots: { startTime: string; endTime: string; remainingCapacity: number }[] }[] = [];

      for (const dayAvail of availabilityData) {
        const dayName = dayAvail.day;
        const daySlots: { _id?: string; startTime: string; endTime: string; remainingCapacity: number }[] = [];

        // 1. Determine the specific date for this upcoming day
        const nextDate = this.getNextDayOccurrence(dayName);
        
        // 2. Daily Usage Check (TimeSlots + TrialClasses)
        const startOfDay = new Date(nextDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(nextDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch ALL TimeSlots for the day (Booked OR Available) to map IDs
        const allTimeSlotsDaily = await this._timeSlotRepo.find({
          mentorId: mentorId,
          startTime: { $gte: startOfDay, $lte: endOfDay }
        } as any);

        // a) Booked Regular Slots count
        const bookedTimeSlotsDaily = allTimeSlotsDaily.filter(ts => ['booked', 'reserved'].includes(ts.status as string));

        // b) Assigned Trial Classes count
        const assignedTrialsDaily = await this._trialClassRepo.find({
           mentor: mentorId,
           preferredDate: { $gte: startOfDay, $lte: endOfDay },
           status: 'assigned'
        } as any);

        const dailyUsage = bookedTimeSlotsDaily.length + assignedTrialsDaily.length;
        const remainingDailyCapacity = Math.max(0, maxSessionsPerDay - dailyUsage);

        // 3. Weekly Usage Check (TimeSlots + TrialClasses)
        const { startOfWeek, endOfWeek } = this.getWeekRange(nextDate);

        const bookedTimeSlotsWeekly = await this._timeSlotRepo.count({
          mentorId: mentorId,
          startTime: { $gte: startOfWeek, $lte: endOfWeek },
          status: { $in: ['booked', 'reserved'] }
        } as any);

        const assignedTrialsWeekly = await this._trialClassRepo.countDocuments({
           mentor: mentorId,
           preferredDate: { $gte: startOfWeek, $lte: endOfWeek },
           status: 'assigned'
        } as any);

        const weeklyUsage = bookedTimeSlotsWeekly + assignedTrialsWeekly;
        const remainingWeeklyCapacity = Math.max(0, maxSessionsPerWeek - weeklyUsage);

        // 4. Effective Capacity Limit
        const effectiveCapacity = Math.min(remainingDailyCapacity, remainingWeeklyCapacity);

        // If no capacity left, skip
        if (effectiveCapacity <= 0) {
          logger.info(`Mentor ${mentorId} has no capacity for ${dayName}`);
          continue;
        }

        // 5. Filter Specific Slots
        const occupiedRanges = new Set<string>();

        // Add regular booked slots to occupied set
        for (const slot of bookedTimeSlotsDaily) {
             const s = slot as unknown as { startTime: Date, endTime: Date };
             if (s && s.startTime && s.endTime) {
                  const startTimeStr = new Date(s.startTime).toTimeString().substring(0, 5); 
                  const endTimeStr = new Date(s.endTime).toTimeString().substring(0, 5);
                  const range = `${startTimeStr}-${endTimeStr}`;
                  occupiedRanges.add(range);
             }
        }

        // Add trial class slots to occupied set
        assignedTrialsDaily.forEach(trial => {
             if(trial && trial.preferredTime) {
                 occupiedRanges.add(trial.preferredTime);
             }
        });

        for (const slot of dayAvail.slots || []) {
          const slotRange = `${slot.startTime}-${slot.endTime}`;
          
          if (occupiedRanges.has(slotRange)) {
              continue; // Skip occupied
          }

          // Find matching TimeSlot document ID
          // matchedDoc type is inferred from Mongoose query result
          const matchingDoc = allTimeSlotsDaily.find(ts => {
             const tsStart = new Date(ts.startTime).toTimeString().substring(0, 5); // HH:MM
             return tsStart === slot.startTime && ts.status === 'available';
          });
          
          const matchingDocTyped = matchingDoc as unknown as { _id: { toString(): string } } | undefined;
          const matchingId = matchingDocTyped?._id?.toString();
          
          const slotItem: { _id?: string; startTime: string; endTime: string; remainingCapacity: number } = {
            startTime: slot.startTime,
            endTime: slot.endTime,
            remainingCapacity: effectiveCapacity
          };
          
          if (matchingId) {
            slotItem._id = matchingId;
          }

          daySlots.push(slotItem);
        }

        if (daySlots.length > 0) {
          result.push({ 
              day: dayName, 
              slots: daySlots 
          });
        }
      }

      logger.info(`Found ${result.length} days with available slots for mentor ${mentorId}`);
      return result;
    } catch (error: unknown) {
      logger.error(`Error in getMentorAvailableSlots for ${mentorId}: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async requestLeave(mentorId: string, startDate: Date, endDate: Date, reason?: string): Promise<void> {
    try {
      logger.info(`Mentor ${mentorId} requesting leave from ${startDate} to ${endDate}`);
      const leaveData: { startDate: Date; endDate: Date; approved: boolean; reason?: string } = {
        startDate,
        endDate,
        approved: false
      };
      if (reason) leaveData.reason = reason;

      await this._mentorRepo.addLeave(mentorId, leaveData);
    } catch (error: unknown) {
      logger.error(`Error in requestLeave: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  async approveLeave(mentorId: string, leaveId: string, adminId: string): Promise<void> {
    try {
      logger.info(`Admin ${adminId} approving leave ${leaveId} for mentor ${mentorId}`);
      await this._mentorRepo.updateLeaveStatus(mentorId, leaveId, true);

      // Get the mentor to find the specific leave dates
      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor || !mentor.leaves) throw new Error("Mentor or leaves not found");

      const leave = mentor.leaves.find(l => (l as unknown as { _id: Types.ObjectId })._id.toString() === leaveId);
      if (!leave) throw new Error("Leave entry not found");

      // Delegate cancellation of affected slots to SchedulingService
      await this._schedulingService.handleMentorLeave(mentorId, leave.startDate, leave.endDate);
      
      logger.info(`Leave ${leaveId} approved and slots handled for mentor ${mentorId}`);
    } catch (error: unknown) {
      logger.error(`Error in approveLeave: ${getErrorMessage(error)}`);
      throw error;
    }
  }

  private getNextDayOccurrence(dayName: string): Date {
    const dayMap: Record<string, number> = {
      'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
      'Thursday': 4, 'Friday': 5, 'Saturday': 6
    };
    const targetDay = dayMap[dayName] ?? 1; // Default to Monday if not found
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntil);
    return nextDate;
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
}

