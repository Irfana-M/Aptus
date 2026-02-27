export interface IBookingSyncService {
  ensureBookingExists(studentId: string, timeSlotId: string, subjectId: string): Promise<void>;
}
