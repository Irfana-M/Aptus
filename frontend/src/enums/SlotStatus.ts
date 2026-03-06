export const SlotStatus = {
  AVAILABLE : 'available',
  RESERVED : 'reserved',
  BOOKED : 'booked',
  CANCELLED : 'cancelled'
} as const;

export type SlotStatus =
  (typeof SlotStatus)[keyof typeof SlotStatus];
