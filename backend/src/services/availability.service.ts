
import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IAvailabilityService } from "../interfaces/services/IAvailabilityService";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { Availability, MentorProfile } from "../interfaces/models/mentor.interface";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";

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

  
  async findMatchingMentors(subject: string, grade: string, days: string[], timeSlot: string): Promise<{ matches: MentorProfile[], alternates: MentorProfile[] }> {
    const allMentors = await this.params.findAvailableMentors({
      gradeId: grade,
      subjectId: subject,
      days: days,
      timeSlot: timeSlot
    }) as (MentorProfile & { conflictingBookings?: unknown[] })[];

    const matches: MentorProfile[] = [];
    const alternates: MentorProfile[] = [];

    for (const mentor of allMentors) {
        let isPerfectMatch = true;

        // 1. Check for Booking Conflicts
        if (mentor.conflictingBookings && mentor.conflictingBookings.length > 0) {
            isPerfectMatch = false;
        }

        // 2. Check Availability Definition (Slots must exist for all requested days)
        if (isPerfectMatch && days.length > 0 && timeSlot) { // Only check if requested and not already ruled out
            const [reqStart, reqEnd] = timeSlot.split('-');
            for (const day of days) {
                const daySchedule = mentor.availability?.find((d: Availability) => d.day === day);
                if (!daySchedule) {
                    isPerfectMatch = false;
                    break;
                }
                const hasSlot = daySchedule.slots.some(s => 
                    s.startTime === reqStart && s.endTime === reqEnd && !s.isBooked
                );
                if (!hasSlot) {
                    isPerfectMatch = false;
                    break;
                }
            }
        } else if (!days || days.length === 0 || !timeSlot) {
            // If No time constraint, everyone who teaches the subject is a "match" for discovery
            isPerfectMatch = true;
        }

        if (isPerfectMatch) {
            matches.push(mentor);
        } else {
            // It's an alternate because they teach the subject but failed time/booking check
            alternates.push(mentor);
        }
    }

    return { matches, alternates };
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
}
