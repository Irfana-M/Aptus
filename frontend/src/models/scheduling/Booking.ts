import type { BookingDto } from '../../types/scheduling.types';
import { TimeSlot } from './TimeSlot';

export class Booking {
  readonly data: BookingDto;
  readonly timeSlot?: TimeSlot;

  constructor(data: BookingDto) {
    this.data = data;
    if (data.timeSlot) {
      this.timeSlot = new TimeSlot(data.timeSlot);
    }
  }

  get id() { return this.data.id; }
  get status() { return this.data.status; }
  get bookedAt() { return new Date(this.data.bookedAt); }

  get statusColor() {
    switch (this.status) {
      case 'confirmed': return 'text-blue-600 bg-blue-50';
      case 'attended': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'cancelled': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }
}

