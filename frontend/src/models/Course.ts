import type { Course as CourseType } from '../types/course.types';

export class Course {
  readonly data: CourseType;

  constructor(data: CourseType) {
    this.data = data;
  }

  get id() { return this.data._id; }
  get fee() { return this.data.fee; }
  get status() { return this.data.status; }
  get isActive() { return this.data.isActive; }

  // Logic: Formatted Fee
  get formattedFee() {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(this.data.fee);
  }

  // Logic: Status formatting
  get statusText() {
    return this.data.status.charAt(0).toUpperCase() + this.data.status.slice(1);
  }

  get statusColor() {
    switch (this.data.status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Logic: Schedule summary
get schedule() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const dayOfWeek = this.data.dayOfWeek;
  if (dayOfWeek === undefined) return undefined;

  const dayName = days[dayOfWeek];
  return `${dayName} at ${this.data.timeSlot}`;
}

  // Logic: Subject and Grade info
  get title() {
    return `${this.data.subject.subjectName} - ${this.data.grade.name}`;
  }
}

