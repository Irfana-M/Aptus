
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IAvailabilityService } from "../interfaces/services/IAvailabilityService";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { ITrialClassRepository } from "../interfaces/repositories/ITrialClassRepository";
import type { IMentorAvailabilityRepository } from "../interfaces/repositories/IMentorAvailabilityRepository";
import type { ITimeSlotRepository } from "../interfaces/repositories/ITimeSlotRepository";
import type { Availability, MentorProfile, TimeSlot } from "../interfaces/models/mentor.interface";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";
import { Types } from "mongoose";
import { isSlotMatching, isShiftMatching } from "../utils/time.util";
import { MESSAGES } from "../constants/messages.constants";

@injectable()
export class AvailabilityService implements IAvailabilityService {
  constructor(
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.ITrialClassRepository) private _trialRepo: ITrialClassRepository,
    @inject(TYPES.IMentorAvailabilityRepository) private _mentorAvailabilityRepo: IMentorAvailabilityRepository,
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository
  ) {}

  async updateAvailability(mentorId: string, schedule: Availability[]): Promise<MentorProfile> {
    // 1. Update old field (for backward compatibility)
    const updatedMentor = await this._mentorRepo.updateProfile(mentorId, { availability: schedule });
    if (!updatedMentor) {
      throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // 2. Also save to MentorAvailability collection (new system)
    try {
      // Delete existing availability records for this mentor
      await this._mentorAvailabilityRepo.deleteMany({ mentorId });

      // Insert new availability records
      for (const dayAvail of schedule) {
        if (dayAvail.slots && dayAvail.slots.length > 0) {
          await this._mentorAvailabilityRepo.create({
            mentorId: new Types.ObjectId(mentorId.toString()) as unknown as import('mongoose').Schema.Types.ObjectId,
            dayOfWeek: dayAvail.day as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
            slots: dayAvail.slots.map(slot => ({
              startTime: slot.startTime,
              endTime: slot.endTime
            })),
            isActive: true,
            effectiveFrom: new Date()
          });
        }
      }

      logger.info(`✅ Updated availability for mentor ${mentorId} in both old and new systems`);
    } catch (error) {
      logger.error(`Failed to sync availability to MentorAvailability collection:`, error);
    }

    return updatedMentor;
  }

  async findMatchingMentors(subject: string, grade: string, days: string[], timeSlot: string, excludeCourseId?: string): Promise<{ matches: MentorProfile[], alternates: MentorProfile[] }> {
    const queryParams = {
        gradeId: grade,
        subjectId: subject,
        days: days,
        timeSlot: timeSlot,
    } as { gradeId: string; subjectId: string; days?: string[]; timeSlot?: string; excludeCourseId?: string; };
    
    if (excludeCourseId) queryParams.excludeCourseId = excludeCourseId;

    const allMentors = await this._mentorRepo.findAvailableMentors(queryParams);
    const mentorList = allMentors as (MentorProfile & { conflictingBookings?: unknown[] })[];
        const matches: MentorProfile[] = [];
        const alternates: MentorProfile[] = [];

        for (const mentor of mentorList) {
            try {
                let isPerfectMatch = true;

                // 1. Check for Booking Conflicts
                if (mentor.conflictingBookings && mentor.conflictingBookings.length > 0) {
                    isPerfectMatch = false;
                }

                // 2. Check Availability Definition
                if (isPerfectMatch && days && days.length > 0 && timeSlot) { 
                    const isShift = ['MORNING', 'AFTERNOON'].includes(timeSlot);
                    for (const day of days) {
                        const daySchedule = mentor.availability?.find((d) => d.day === day);
                        if (!daySchedule || !daySchedule.slots || !Array.isArray(daySchedule.slots)) {
                            isPerfectMatch = false;
                            break;
                        }

                        if (isShift) {
                            const hasSlotInShift = daySchedule.slots.some((slot: TimeSlot) => 
                                isShiftMatching(slot.startTime, timeSlot as 'MORNING' | 'AFTERNOON') && !slot.isBooked
                            );
                            if (!hasSlotInShift) {
                                isPerfectMatch = false;
                                break;
                            }
                        } else {
                            const [reqStart, reqEnd] = timeSlot.split('-').map(part => part.trim());
                            const hasSlot = daySchedule.slots.some((slot: TimeSlot) => 
                                isSlotMatching(slot.startTime, slot.endTime, reqStart || "", reqEnd) && !slot.isBooked
                            );
                            if (!hasSlot) {
                                isPerfectMatch = false;
                                break;
                            }
                        }
                    }
                }

                // 3. Aggregate Trial Feedback
                let finalRating = mentor.rating || 0;
                let finalTotal = mentor.totalRatings || 0;

                try {
                    const mentorObjectId = new Types.ObjectId(mentor._id);
                    const trialStats = await this._trialRepo.aggregate([
                        { $match: { 
                            $or: [
                                { mentor: mentorObjectId },
                                { mentor: mentor._id.toString() }
                            ],
                            'feedback.rating': { $exists: true } 
                        }},
                        { $group: {
                            _id: "$mentor",
                            avgRating: { $avg: "$feedback.rating" },
                            count: { $sum: 1 }
                        }}
                    ]);

                    const stats = trialStats as unknown as { avgRating: number; count: number }[];
                    if (stats.length > 0 && finalTotal === 0) {
                        finalRating = Number((stats[0]?.avgRating ?? 0).toFixed(1));
                        finalTotal = stats[0]?.count ?? 0;
                    }
                } catch (_err) {
                    logger.warn(`Could not aggregate trial stats for mentor ${mentor._id}`);
                }

                const mentorWithStats = {
                    ...mentor,
                    rating: finalRating,
                    totalRatings: finalTotal
                };

                if (isPerfectMatch) {
                    matches.push(mentorWithStats);
                } else {
                    alternates.push(mentorWithStats);
                }
            } catch (_mentorError) {
                continue;
            }
        }
        return { matches, alternates };
  }

  async getAvailability(mentorId: string): Promise<Availability[]> {
    const mentor = await this._mentorRepo.getProfileWithImage(mentorId);
    if (!mentor) {
        throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    return mentor.availability || [];
  }

  async bookSlots(mentorId: string, days: string[], timeSlot: string, _maxStudents: number = 10): Promise<void> {
    const mentor = await this._mentorRepo.getProfileWithImage(mentorId);
    if (!mentor || !mentor.availability) {
      throw new AppError(MESSAGES.AVAILABILITY.MENTOR_NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const timeSlots = timeSlot.includes('|') ? timeSlot.split('|') : [timeSlot];

    const updatedAvailability = mentor.availability.map(daySchedule => {
      if (days.includes(daySchedule.day)) {
        return {
          ...daySchedule,
          slots: daySchedule.slots.map(slot => {
            for (const ts of timeSlots) {
              const [start, end] = ts.trim().split('-');
              if (slot.startTime === start && slot.endTime === end) {
                return { ...slot, isBooked: true }; 
              }
            }
            return slot;
          })
        };
      }
      return daySchedule;
    });

    await this._mentorRepo.updateProfile(mentorId, { availability: updatedAvailability });
    logger.info(`✅ Booked slots for mentor ${mentorId}: ${days.join(', ')} at ${timeSlot}`);
  }

  async releaseSlots(mentorId: string, days: string[], timeSlot: string): Promise<void> {
    const mentor = await this._mentorRepo.getProfileWithImage(mentorId);
    if (!mentor || !mentor.availability) {
      throw new AppError(MESSAGES.AVAILABILITY.MENTOR_NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const timeSlots = timeSlot.includes('|') ? timeSlot.split('|') : [timeSlot];

    const updatedAvailability = mentor.availability.map(daySchedule => {
      if (days.includes(daySchedule.day)) {
        return {
          ...daySchedule,
          slots: daySchedule.slots.map(slot => {
            for (const ts of timeSlots) {
              const [start, end] = ts.trim().split('-');
              if (slot.startTime === start && slot.endTime === end) {
                return { ...slot, isBooked: false }; 
              }
            }
            return slot;
          })
        };
      }
      return daySchedule;
    });

    await this._mentorRepo.updateProfile(mentorId, { availability: updatedAvailability });
    logger.info(`✅ Released slots for mentor ${mentorId}: ${days.join(', ')} at ${timeSlot}`);
  }

  async getPublicProfile(mentorId: string): Promise<Partial<MentorProfile & { reviews: Array<{ studentName: string; rating: number; comment: string; date: Date }> }>> {
      const mentor = await this._mentorRepo.getProfileWithImage(mentorId);
      if (!mentor) {
          throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      let reviews: Array<{ studentName: string; rating: number; comment: string; date: Date }> = [];
      let calculatedRating = mentor.rating || 0;
      let calculatedTotal = mentor.totalRatings || 0;

      try {
          const mentorObjectId = new Types.ObjectId(mentorId);
          
          const trialFeedback = await this._trialRepo.find({ 
              $or: [
                { mentor: mentorObjectId },
                { mentor: mentorId }
              ],
              'feedback.rating': { $exists: true } 
          });

          // Sort and limit in memory since we used find (better would be a repository method for this)
          const sortedFeedback = trialFeedback
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

          reviews = sortedFeedback.map((tf) => {
              const student = tf.student as unknown as { fullName?: string };
              return {
                  studentName: student?.fullName || "Anonymous Student",
                  rating: tf.feedback?.rating || 0,
                  comment: tf.feedback?.comment || "",
                  date: tf.createdAt
              };
          });
          
          if (calculatedTotal === 0) {
              const trialStats = await this._trialRepo.aggregate([
                  { $match: { 
                      $or: [
                        { mentor: mentorObjectId },
                        { mentor: mentorId }
                      ],
                      'feedback.rating': { $exists: true } 
                  }},
                  { $group: {
                      _id: "$mentor",
                      avgRating: { $avg: "$feedback.rating" },
                      count: { $sum: 1 }
                  }}
              ]);

              const stats = trialStats as unknown as { avgRating: number; count: number }[];
              if (stats.length > 0 && stats[0]) {
                  calculatedRating = Number((stats[0].avgRating || 0).toFixed(1));
                  calculatedTotal = stats[0].count || 0;
              }
          }
      } catch (error) {
          logger.error("❌ Error fetching trial reviews for mentor profile:", error);
      }

      const {
          _id,
          fullName,
          profileImageUrl,
          subjectProficiency,
          academicQualifications,
          experiences,
          bio,
      } = mentor;

      const publicProfile: Partial<MentorProfile & { reviews: Array<{ studentName: string; rating: number; comment: string; date: Date }> }> = {
          _id,
          fullName,
          profileImageUrl: profileImageUrl as string | undefined,
          subjectProficiency,
          academicQualifications,
          experiences,
          bio: bio || "",
          rating: calculatedRating,
          totalRatings: calculatedTotal,
          reviews
      };

      return publicProfile;
  }
}
