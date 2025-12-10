export interface CreateOneToOneCourseDto {
  grade: string;
  subject: string;
  mentor: string;
  dayOfWeek?: number;
  timeSlot?: string;
  startDate: string;
  endDate: string;
  fee?: number;
}