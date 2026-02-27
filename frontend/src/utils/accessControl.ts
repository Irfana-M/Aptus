export const AccessState = {
  FORBIDDEN: 'FORBIDDEN',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  PROFILE_COMPLETION: 'PROFILE_COMPLETION',
  TRIAL_BOOKING: 'TRIAL_BOOKING',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  FULLY_QUALIFIED: 'FULLY_QUALIFIED',
} as const;

export type AccessState = (typeof AccessState)[keyof typeof AccessState];

export const ACCESS_STATE_HIERARCHY: Record<AccessState, number> = {
  [AccessState.FORBIDDEN]: 0,
  [AccessState.EMAIL_VERIFICATION]: 1,
  [AccessState.PROFILE_COMPLETION]: 2,
  [AccessState.TRIAL_BOOKING]: 3,
  [AccessState.PAYMENT_REQUIRED]: 4,
  [AccessState.FULLY_QUALIFIED]: 5,
};

import type { StudentBaseResponseDto } from '../types/studentTypes';

export const resolveAccessState = (user: StudentBaseResponseDto | null | undefined): AccessState => {
  if (!user) return AccessState.FORBIDDEN;
  if (user.role !== 'student') return AccessState.FULLY_QUALIFIED; // Admins/Mentors have their own logic, usually fully qualified for student views

  if (!user.isVerified) return AccessState.EMAIL_VERIFICATION;
  if (!user.isProfileComplete) return AccessState.PROFILE_COMPLETION;
  if (!user.isTrialCompleted) return AccessState.TRIAL_BOOKING;
  
  const isSubscribed = user.isPaid || (user.subscription?.status === 'active');
  if (!isSubscribed) return AccessState.PAYMENT_REQUIRED;

  return AccessState.FULLY_QUALIFIED;
};

export const getRecommendedRedirect = (state: AccessState): string => {
  switch (state) {
    case AccessState.EMAIL_VERIFICATION: return '/verify-email';
    case AccessState.PROFILE_COMPLETION: return '/complete-profile';
    case AccessState.TRIAL_BOOKING: return '/select-trial';
    case AccessState.PAYMENT_REQUIRED: return '/subscription';
    case AccessState.FULLY_QUALIFIED: return '/dashboard';
    default: return '/login';
  }
};
