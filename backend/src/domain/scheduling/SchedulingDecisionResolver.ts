import type { StudentProfile } from "../../interfaces/models/student.interface.js";
import type { ITimeSlot } from "../../interfaces/models/timeSlot.interface.js";
import type { ISubscriptionPlan, IStudentSubscription } from "../../interfaces/models/subscription.interface.js";
import { BookingEligibility, SCHEDULING_CONFIG } from "../../constants/schedulingDecision.js";
import type { IBooking } from "../../interfaces/models/booking.interface.js";
import type { MentorProfile } from "../../interfaces/models/mentor.interface.js";

export interface SchedulingContext {
  student: StudentProfile;
  slot: ITimeSlot;
  mentor: Partial<MentorProfile>; 
  activeSubscription?: IStudentSubscription;
  plan?: ISubscriptionPlan;
  studentBookings: IBooking[]; 
  mentorDailyCount: number;
}

export class SchedulingDecisionResolver {
  public static resolve(ctx: SchedulingContext): { eligibility: BookingEligibility; reason?: string } {
    const { student, slot, mentor, activeSubscription, plan, studentBookings, mentorDailyCount } = ctx;

    
    if (student.isBlocked) {
      return { eligibility: BookingEligibility.FORBIDDEN, reason: "Account is blocked." };
    }

    
    if (!student.isTrialCompleted) {
       
       if (slot.status !== 'available') {
           return { eligibility: BookingEligibility.SLOT_FULL, reason: "This trial slot is no longer available." };
       }
       return { eligibility: BookingEligibility.ELIGIBLE };
    }

    
    if (!activeSubscription || activeSubscription.status !== 'active') {
      return { eligibility: BookingEligibility.PLAN_MISMATCH, reason: "Active subscription required." };
    }

    
    const hasOverlap = studentBookings.some(b => {
      const bookedSlot = b.timeSlotId as unknown as ITimeSlot;
      if (!bookedSlot) return false;
      return (
        (slot.startTime < bookedSlot.endTime && slot.startTime >= bookedSlot.startTime) ||
        (slot.endTime > bookedSlot.startTime && slot.endTime <= bookedSlot.endTime)
      );
    });

    if (hasOverlap) {
      return { eligibility: BookingEligibility.OVERLAP, reason: "You already have a session scheduled at this time." };
    }

    
    if (plan && !plan.mentorChoice) {
       // Logic for mentorChoice restriction if any
    }

    
    if (slot.currentStudentCount >= slot.maxStudents) {
      return { eligibility: BookingEligibility.SLOT_FULL, reason: "This slot is full." };
    }

    
    
    if (mentor.maxSessionsPerDay && mentorDailyCount >= mentor.maxSessionsPerDay) {
      return { eligibility: BookingEligibility.MENTOR_LIMIT_REACHED, reason: "Mentor daily limit reached." };
    }

    return { eligibility: BookingEligibility.ELIGIBLE };
  }

  public static canCancel(startTime: Date): { allowed: boolean; reason?: string } {
    const now = new Date();
    const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < SCHEDULING_CONFIG.MIN_CANCELLATION_HOURS) {
      return { 
        allowed: false, 
        reason: `Cancellations must be made at least ${SCHEDULING_CONFIG.MIN_CANCELLATION_HOURS} hours in advance.` 
      };
    }

    return { allowed: true };
  }
}
