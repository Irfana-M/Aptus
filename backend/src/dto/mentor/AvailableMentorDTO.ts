import type { MentorProfile, SubjectProficency } from "../../interfaces/models/mentor.interface";
export class AvailableMentorDto {
  _id: string;
  id: string;
  fullName: string;
  profilePicture?: string | null;
  profileImageUrl?: string | null;
  rating: number;
  bio?: string;
  level: "intermediate" | "expert";
  availableSlots?: string[];
  availability?: {
    day: string;
    slots: {
      startTime: string;
      endTime: string;
      isBooked: boolean;
    }[];
  }[];
  hasConflict: boolean = false;
  conflictingBookings?: any[];

  constructor(mentorDoc: MentorProfile, targetSubjectName: string) {
    this._id = mentorDoc._id?.toString() || "";
    this.id = this._id;
    this.fullName = mentorDoc.fullName;
    this.profilePicture = mentorDoc.profilePicture || null;
    this.profileImageUrl = mentorDoc.profileImageUrl || null;
    this.rating = mentorDoc.rating || 0;
    this.bio = mentorDoc.bio || "";

    const proficiency = mentorDoc.subjectProficiency?.find(
      (sp: SubjectProficency) => sp.subject === targetSubjectName
    );
    this.level = proficiency?.level === "expert" ? "expert" : "intermediate";
    
    if (mentorDoc.conflictingBookings && mentorDoc.conflictingBookings.length > 0) {
      this.hasConflict = true;
      this.conflictingBookings = mentorDoc.conflictingBookings;
    }

    if (mentorDoc.availability) {
      this.availability = mentorDoc.availability.map(day => ({
        day: day.day,
        slots: day.slots.map(slot => ({
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: (slot as any).isBooked || false
        }))
      }));
    }
  }
}
