
import type { Availability, MentorProfile } from "../models/mentor.interface";

export interface IAvailabilityService {
  updateAvailability(mentorId: string, schedule: Availability[]): Promise<MentorProfile>;

  findMatchingMentors(subject: string, grade: string, days: string[], timeSlot: string): Promise<{ matches: MentorProfile[], alternates: MentorProfile[] }>;
  bookSlots(mentorId: string, days: string[], timeSlot: string): Promise<void>;
  getAvailability(mentorId: string): Promise<Availability[]>;
}
