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
    studentId: string | any; // Populated or ID
    mentorId: string | any;   // Populated or ID
    subjectId: string | any;  // Populated or ID
    courseId?: string | any;
    enrollmentId?: string | any;
    startTime: string; // ISO Date string
    endTime: string;   // ISO Date string
    status: 'scheduled' | 'completed' | 'cancelled' | 'live' | 'rescheduling' | 'in_progress';
    cancelledBy?: 'student' | 'mentor' | 'admin' | null;
    cancellationReason?: string | null;
    sessionType?: 'group' | 'one-to-one';
    meetingLink?: string;
    topic?: string;
    timeSlotId?: string;
    // New fields for Rescheduling and Leave
    isRescheduled?: boolean;
    rescheduledTo?: string;
    leaveRequestedAt?: string;
}
