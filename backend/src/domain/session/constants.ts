export enum SessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ABSENT = 'absent'
}

export type SessionStatusType = 'scheduled' | 'completed' | 'cancelled' | 'absent';

export const SESSION_DURATION_MINUTES = 60;
export const TRIAL_SESSION_DURATION_MINUTES = 30;
export const WINDOW_BEFORE_SESSION_START_MINUTES = 15;
export const CANCELLATION_WINDOW_HOURS = 24;
