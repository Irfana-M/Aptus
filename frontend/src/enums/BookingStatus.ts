export const BookingStatus = {
  SCHEDULED : 'scheduled',
  COMPLETED : 'completed',
  CANCELLED : 'cancelled',
  ABSENT : 'absent',
} as const;

export type BookingStatus =
  (typeof BookingStatus)[keyof typeof BookingStatus];
