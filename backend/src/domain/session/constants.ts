export enum SessionStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ABSENT = 'absent'
}

export type SessionStatusType = 'scheduled' | 'completed' | 'cancelled' | 'absent';
