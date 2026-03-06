import type { MentorProfile } from "../mentor.types";
import type { SubjectPreference } from "../student.types";
// import type { Subject } from "../admin.types";

export interface CourseRequestData {
  subject: string;
  grade: string;
  mentoringMode: string;
  preferredDays: string[];
  timeSlot: string;
  timezone?: string;
}

export type { SubjectPreference };

export interface MentorMatch {
    matches: MentorProfile[];
    alternates: MentorProfile[];
}

export interface MentorRequest {
    _id: string;
    mentorId?: { _id: string };
    subjectId?: { _id: string };
    status: string;
    createdAt: string;
}

export interface DayAvailability {
    day: string;
    date: string;
    slots: {
        _id?: string;
        startTime: string;
        endTime: string;
        remainingCapacity: number;
    }[];
}
