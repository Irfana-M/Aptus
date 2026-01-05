export interface CreateOneToOneCourseDto {
  grade: string;
  subject: string;
  mentor: string;
  student?: string | undefined;
  dayOfWeek?: number | undefined;
  timeSlot?: string | undefined;
  schedule?: {
    days: string[];
    timeSlot: string;
  } | undefined;
  startDate: string;
  endDate: string;
  fee?: number | undefined;
  status?: string | undefined;
}