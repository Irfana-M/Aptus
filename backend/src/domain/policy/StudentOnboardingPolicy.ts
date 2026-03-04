import { StudentOnboardingStatus } from "../../enums/studentOnboarding.enum.js";
import type { OnboardingEvent } from "../../enums/studentOnboarding.enum.js";


export class StudentOnboardingPolicy {
  
  private static readonly ALLOWED_TRANSITIONS: Record<StudentOnboardingStatus, StudentOnboardingStatus[]> = {
    [StudentOnboardingStatus.REGISTERED]: [StudentOnboardingStatus.PROFILE_COMPLETE],
    [StudentOnboardingStatus.PROFILE_COMPLETE]: [StudentOnboardingStatus.TRIAL_BOOKED],
    [StudentOnboardingStatus.TRIAL_BOOKED]: [StudentOnboardingStatus.TRIAL_ATTENDED],
    [StudentOnboardingStatus.TRIAL_ATTENDED]: [StudentOnboardingStatus.FEEDBACK_SUBMITTED],
    [StudentOnboardingStatus.FEEDBACK_SUBMITTED]: [StudentOnboardingStatus.SUBSCRIBED],
    [StudentOnboardingStatus.SUBSCRIBED]: [StudentOnboardingStatus.PREFERENCES_COMPLETED],
    [StudentOnboardingStatus.PREFERENCES_COMPLETED]: [],
  };

  
  private static readonly EVENT_TO_STATUS: Record<OnboardingEvent, StudentOnboardingStatus> = {
    'PROFILE_COMPLETED': StudentOnboardingStatus.PROFILE_COMPLETE,
    'TRIAL_BOOKED': StudentOnboardingStatus.TRIAL_BOOKED,
    'TRIAL_ATTENDED': StudentOnboardingStatus.TRIAL_ATTENDED,
    'FEEDBACK_SUBMITTED': StudentOnboardingStatus.FEEDBACK_SUBMITTED,
    'SUBSCRIBED': StudentOnboardingStatus.SUBSCRIBED,
    'PREFERENCES_COMPLETED': StudentOnboardingStatus.PREFERENCES_COMPLETED,
  };

  
  private static readonly ROUTE_MAP: Record<StudentOnboardingStatus, string> = {
    [StudentOnboardingStatus.REGISTERED]: '/student/profile-setup',
    [StudentOnboardingStatus.PROFILE_COMPLETE]: '/student/book-free-trial',
    [StudentOnboardingStatus.TRIAL_BOOKED]: '/student/trial-pending',
    [StudentOnboardingStatus.TRIAL_ATTENDED]: '/student/trial-feedback',
    [StudentOnboardingStatus.FEEDBACK_SUBMITTED]: '/student/subscription-plans',
    [StudentOnboardingStatus.SUBSCRIBED]: '/student/preferences/subjects',
    [StudentOnboardingStatus.PREFERENCES_COMPLETED]: '/student/dashboard',
  };

 
  static canTransition(from: StudentOnboardingStatus, to: StudentOnboardingStatus): boolean {
    const transitions = this.ALLOWED_TRANSITIONS[from];
    return transitions.includes(to);
  }

  
  static getStatusForEvent(event: OnboardingEvent): StudentOnboardingStatus {
    return this.EVENT_TO_STATUS[event];
  }

  static getRequiredRoute(status: StudentOnboardingStatus): string {
    return this.ROUTE_MAP[status];
  }

  static canBookTrial(status: StudentOnboardingStatus): boolean {
    return status === StudentOnboardingStatus.PROFILE_COMPLETE;
  }

 
  static canSubmitFeedback(status: StudentOnboardingStatus): boolean {
    return status === StudentOnboardingStatus.TRIAL_ATTENDED;
  }

  
  static canAccessDashboard(status: StudentOnboardingStatus): boolean {
    return status === StudentOnboardingStatus.PREFERENCES_COMPLETED;
  }
}
