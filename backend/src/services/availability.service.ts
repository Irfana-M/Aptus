
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IAvailabilityService } from "../interfaces/services/IAvailabilityService";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { Availability, MentorProfile } from "../interfaces/models/mentor.interface";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { logger } from "../utils/logger";

@injectable()
export class AvailabilityService implements IAvailabilityService {
  constructor(
    @inject(TYPES.IMentorRepository) private params: IMentorRepository
  ) {}

  async updateAvailability(mentorId: string, schedule: Availability[]): Promise<MentorProfile> {
    
    const updatedMentor = await this.params.updateProfile(mentorId, { availability: schedule });
    if (!updatedMentor) {
      throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
    }
    return updatedMentor;
  }

  
  async findMatchingMentors(subject: string, grade: string, days: string[], timeSlot: string, excludeCourseId?: string): Promise<{ matches: MentorProfile[], alternates: MentorProfile[] }> {
    try {
        const queryParams: any = {
            gradeId: grade,
            subjectId: subject,
            days: days,
            timeSlot: timeSlot,
        };
        if (excludeCourseId) queryParams.excludeCourseId = excludeCourseId;

        const allMentors = await this.params.findAvailableMentors(queryParams) as (MentorProfile & { conflictingBookings?: unknown[] })[];

        const matches: MentorProfile[] = [];
        const alternates: MentorProfile[] = [];

        logger.info(`Checking matches for subject=${subject}, grade=${grade}, days=${days}, time=${timeSlot} among ${allMentors.length} candidates`);

        for (const mentor of allMentors) {
            try {
                let isPerfectMatch = true;

                // 1. Check for Booking Conflicts
                if (mentor.conflictingBookings && mentor.conflictingBookings.length > 0) {
                    // logger.info(`Mentor ${mentor._id} rejected: Has conflicting bookings`); 
                    isPerfectMatch = false;
                }

                // 2. Check Availability Definition (Slots must exist for all requested days)
                if (isPerfectMatch && days && days.length > 0 && timeSlot) { 
                    const [reqStart, reqEnd] = timeSlot.split('-');
                    for (const day of days) {
                        const daySchedule = mentor.availability?.find((d: Availability) => d.day === day);
                        if (!daySchedule) {
                            // logger.info(`Mentor ${mentor._id} rejected: No availability set for ${day}`);
                            isPerfectMatch = false;
                            break;
                        }
                        
                        // Defensive check for slots
                        if (!daySchedule.slots || !Array.isArray(daySchedule.slots)) {
                             logger.warn(`Mentor ${mentor._id} has malformed slots for ${day}`);
                             isPerfectMatch = false;
                             break;
                        }

                        const hasSlot = daySchedule.slots.some((s: any) => 
                            s.startTime === reqStart && s.endTime === reqEnd && !s.isBooked
                        );
                        if (!hasSlot) {
                            // logger.info(`Mentor ${mentor._id} rejected: No slot ${reqStart}-${reqEnd} on ${day}`);
                            isPerfectMatch = false;
                            break;
                        }
                    }
                } else if (!days || days.length === 0 || !timeSlot) {
                    isPerfectMatch = true;
                }

                if (isPerfectMatch) {
                    matches.push(mentor);
                } else {
                    alternates.push(mentor);
                }
            } catch (mentorError) {
                logger.error(`Error processing mentor ${mentor._id}:`, mentorError);
                // Continue to next mentor instead of crashing entire request
                continue;
            }
        }
        
        logger.info(`Found ${matches.length} perfect matches and ${alternates.length} alternates`);
        return { matches, alternates };
    } catch (error) {
        logger.error(`Fatal error in findMatchingMentors service:`, error);
        throw error;
    }
  }

  async getAvailability(mentorId: string): Promise<Availability[]> {
    const mentor = await this.params.getProfileWithImage(mentorId);
    if (!mentor) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
    }
    return mentor.availability || [];
  }

  async bookSlots(mentorId: string, days: string[], timeSlot: string): Promise<void> {
    const mentor = await this.params.getProfileWithImage(mentorId);
    if (!mentor || !mentor.availability) {
      throw new AppError("Mentor not found or availability not set", HttpStatusCode.NOT_FOUND);
    }

    const updatedAvailability = mentor.availability.map(daySchedule => {
      if (days.includes(daySchedule.day)) {
        return {
          ...daySchedule,
          slots: daySchedule.slots.map(slot => {
             // Check timeSlot match? The stored slots have startTime/endTime.
             // The input timeSlot is "HH:MM-HH:MM".
             // We need to parse strict equality or overlap?
             // For now, let's assume strict string match of constructed range or strict startTime/endTime match if passed separately.
             // My models use startTime/endTime separately.
             // timeSlot input format "17:00-18:00"
             const [start, end] = timeSlot.split('-');
             if (slot.startTime === start && slot.endTime === end) {
               return { ...slot, isBooked: true };
             }
             return slot;
          })
        };
      }
      return daySchedule;
    });

    await this.params.updateProfile(mentorId, { availability: updatedAvailability });
  }

  async getPublicProfile(mentorId: string): Promise<Partial<MentorProfile>> {
      const mentor = await this.params.getProfileWithImage(mentorId);
      if (!mentor) {
          throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }

      // Return only safe-to-display fields
      const {
          _id,
          fullName,
          profileImageUrl,
          subjectProficiency,
          academicQualifications,
          experiences,
          bio,
          // Add other public fields as needed
      } = mentor;

      return {
          _id,
          fullName,
          profileImageUrl,
          subjectProficiency,
          academicQualifications,
          experiences,
          bio: bio || undefined
      };
  }
}
