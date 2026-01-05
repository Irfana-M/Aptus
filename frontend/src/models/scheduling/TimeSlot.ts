import type { TimeSlotDto } from '../../types/schedulingTypes';
import { SlotStatus } from '../../enums/SlotStatus';

export class TimeSlot {
  readonly data: TimeSlotDto;

  constructor(data: TimeSlotDto) {
    this.data = data;
  }

  get id() { return this.data.id; }
  get mentorId() { return this.data.mentorId; }
  get mentorName() { return this.data.mentorName || 'Unknown Mentor'; }
  get startTime() { return new Date(this.data.startTime); }
  get endTime() { return new Date(this.data.endTime); }
  get status() { return this.data.status; }
  get maxStudents() { return this.data.maxStudents; }
  get currentCount() { return this.data.currentStudentCount; }
  get availableSpots() { return this.maxStudents - this.currentCount; }
  
  get isFull() { return this.currentCount >= this.maxStudents; }
  get isAvailable() { return this.status === SlotStatus.AVAILABLE && !this.isFull; }

  get formattedTime() {
    return this.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  get formattedDate() {
    return this.startTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  get durationInMinutes() {
    return Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
}
