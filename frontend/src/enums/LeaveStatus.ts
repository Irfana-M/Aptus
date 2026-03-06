export const LeaveStatus = {
  PENDING : 'pending',
  APPROVED : 'approved',
  REJECTED : 'rejected',
} as const;
export type LeaveStatus =
  (typeof LeaveStatus)[keyof typeof LeaveStatus];
