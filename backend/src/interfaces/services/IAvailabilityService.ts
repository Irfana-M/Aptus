
import type { Availability, MentorProfile } from "../models/mentor.interface";

export interface IAvailabilityService {
  updateAvailability(mentorId: string, schedule: Availability[]): Promise<MentorProfile>;

  findMatchingMentors(subject: string, grade: string, days: string[], timeSlot: string, excludeCourseId?: string): Promise<{ matches: MentorProfile[], alternates: MentorProfile[] }>;
  bookSlots(mentorId: string, days: string[], timeSlot: string, maxStudents?: number): Promise<void>;
  releaseSlots(mentorId: string, days: string[], timeSlot: string): Promise<void>;
  getAvailability(mentorId: string): Promise<Availability[]>;
  getPublicProfile(mentorId: string): Promise<Partial<MentorProfile & { reviews: { studentName: string; rating: number; comment: string; date: Date }[] }>>;
}
