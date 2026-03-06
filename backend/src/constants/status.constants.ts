export enum LEAVE_STATUS {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export enum SESSION_STATUS {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NOT_HELD = 'not_held',
  CANCELLED = 'cancelled',
  RESCHEDULING = 'rescheduling',
  NEEDS_MENTOR_REASSIGNMENT = 'needs_mentor_reassignment'
}

export enum BOOKING_STATUS {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ABSENT = 'absent'
}
