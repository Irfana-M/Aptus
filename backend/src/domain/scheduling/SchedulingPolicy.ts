import { injectable } from 'inversify';
import type { ITimeSlot } from '../../interfaces/models/timeSlot.interface';
import type { IBooking } from '../../interfaces/models/booking.interface';
import type { StudentProfile } from '../../interfaces/models/student.interface';

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

@injectable()
export class SchedulingPolicy {
 
  canStudentBook(student: StudentProfile, slot: ITimeSlot, studentBookings: IBooking[]): PolicyResult {
    
    const overlap = studentBookings.some(b => {
        const bookedSlot = b.timeSlotId as any; 
        if (!bookedSlot) return false;
        
        return (
            (slot.startTime < bookedSlot.endTime && slot.startTime >= bookedSlot.startTime) ||
            (slot.endTime > bookedSlot.startTime && slot.endTime <= bookedSlot.endTime) ||
            (slot.startTime <= bookedSlot.startTime && slot.endTime >= bookedSlot.endTime)
        );
    });

    if (overlap) {
      return { allowed: false, reason: "You already have a session scheduled at this time." };
    }

    if (slot.currentStudentCount >= slot.maxStudents) {
      return { allowed: false, reason: "This slot has reached its maximum student capacity." };
    }

    return { allowed: true };
  }

  
  isMentorWithinLimits(mentor: any, dailyCount: number, weeklyCount: number): PolicyResult {
    if (mentor.maxSessionsPerDay && dailyCount >= mentor.maxSessionsPerDay) {
      return { allowed: false, reason: "Mentor daily session limit reached." };
    }
    
    if (mentor.maxSessionsPerWeek && weeklyCount >= mentor.maxSessionsPerWeek) {
      return { allowed: false, reason: "Mentor weekly session limit reached." };
    }

    return { allowed: true };
  }
}
