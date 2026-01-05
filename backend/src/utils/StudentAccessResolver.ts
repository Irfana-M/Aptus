import type { StudentProfile } from "../interfaces/models/student.interface";
import { AccessState } from "../constants/accessControl";

export class StudentAccessResolver {
  public static resolve(student: StudentProfile): AccessState {
    // 0. Priority: Use new Onboarding Status if available
    if (student.onboardingStatus) {
        switch (student.onboardingStatus) {
            case 'registered':
                // Fix for migration or desync: If legacy flag says profile is complete, allow it
                if (student.isProfileCompleted) return AccessState.TRIAL_BOOKING;
                return student.isVerified ? AccessState.PROFILE_COMPLETION : AccessState.EMAIL_VERIFICATION;
            case 'profile_complete':
                return AccessState.TRIAL_BOOKING;
            case 'trial_booked':
                return AccessState.TRIAL_BOOKING; // Still can access trial pages
            case 'trial_attended':
                return AccessState.TRIAL_BOOKING; // Needs to submit feedback (or just waiting)
            case 'feedback_submitted':
                return AccessState.PAYMENT_REQUIRED;
            case 'subscribed':
                return AccessState.PREFERENCES_REQUIRED;
            case 'preferences_completed':
                return AccessState.FULLY_QUALIFIED;
        }
    }

    // Fallback to legacy flags
    if (!student) return AccessState.FORBIDDEN;

    // 1. Check Verification
    if (!student.isVerified) {
      return AccessState.EMAIL_VERIFICATION;
    }

    // 2. Check Profile Completion
    if (!student.isProfileCompleted) {
      return AccessState.PROFILE_COMPLETION;
    }

    // 3. Check Trial Completion
    if (!student.isTrialCompleted) {
       return AccessState.TRIAL_BOOKING;
    }

    // 4. Check Payment/Subscription
    const isSubscribed = student.hasPaid && student.subscription?.status === 'active';
    if (!isSubscribed) {
      return AccessState.PAYMENT_REQUIRED;
    }

    // 5. Check Preferences
    if (!student.preferencesCompleted) {
        return AccessState.PREFERENCES_REQUIRED;
    }

    // 6. Fully Qualified
    return AccessState.FULLY_QUALIFIED;
}
}
