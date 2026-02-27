export enum StudentOnboardingStatus {
  REGISTERED = 'registered',
  PROFILE_COMPLETE = 'profile_complete',
  TRIAL_BOOKED = 'trial_booked',
  TRIAL_ATTENDED = 'trial_attended',
  FEEDBACK_SUBMITTED = 'feedback_submitted',
  SUBSCRIBED = 'subscribed',
  PREFERENCES_COMPLETED = 'preferences_completed',
}


export type OnboardingEvent =
  | 'PROFILE_COMPLETED'
  | 'TRIAL_BOOKED'
  | 'TRIAL_ATTENDED'
  | 'FEEDBACK_SUBMITTED'
  | 'SUBSCRIBED'
  | 'PREFERENCES_COMPLETED';
