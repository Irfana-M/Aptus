export interface ISlotGenerationService {
  generateSlots(projectionDays: number): Promise<void>;
  generateMentorSlots(mentorId: string, projectionDays: number): Promise<void>;
  ensureTimeSlot(mentorId: string, startTime: Date, endTime: Date): Promise<string>;
}
