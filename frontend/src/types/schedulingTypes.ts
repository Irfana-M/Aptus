import { SlotStatus } from '../enums/SlotStatus';

export interface TimeSlotDto {
  id: string;
  mentorId: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  maxStudents: number;
  currentStudentCount: number;
  recurringId?: string;
  mentorName?: string;
}

export interface BookingDto {
  id: string;
  studentId: string;
  timeSlotId: string;
  studentSubjectId: string;
  status: 'confirmed' | 'cancelled' | 'attended' | 'absent';
  bookedAt: string;
  timeSlot?: TimeSlotDto;
}

export interface AttendanceSummaryDto {
  totalSessions: number;
  attendedSessions: number;
  absentSessions: number;
  cancelledByMentor: number;
  totalHours: number;
}

export interface Session {
    id: string;
    studentId: string | unknown; // Populated or ID
    mentorId: string | unknown;   // Populated or ID
    subjectId: string | unknown;  // Populated or ID
    startTime: string; // ISO Date string
    endTime: string;   // ISO Date string
    status: 'scheduled' | 'completed' | 'cancelled' | 'live';
    meetingLink?: string;
    topic?: string;
    timeSlotId?: string;
}
