import type { CoursePaginationParams } from "@/dto/shared/paginationTypes";
import type { ICourse } from "@/models/course.model";

export interface CreateOneToOneCourseDto {
  grade: string;
  subject: string;
  mentor: string;
  student?: string; // Optional if course is just "available" initially, but here we seem to set it
  dayOfWeek?: number;
  timeSlot?: string;
  schedule?: {
    days: string[];
    timeSlot: string;
  };
  startDate: Date;
  endDate: Date;
  fee?: number;
  status?: string;
}

export interface CoursePaginatedResult {
  courses: ICourse[];
  total: number;
}

export interface ICourseRepository {
  /**
   * Check if a mentor already has a booked/active course on this day + time slot
   */
  /**
   * Create a new 1:1 course (admin creates it as "available")
   */
  createOneToOneCourse(data: CreateOneToOneCourseDto): Promise<ICourse>;
  getAllOneToOneCourses(): Promise<ICourse[]>;
  findAllCoursesPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult>;
  findAvailableCourses(filters: Record<string, unknown>): Promise<ICourse[]>;
  findById(id: string): Promise<ICourse | null>;
  findByStudent(studentId: string): Promise<ICourse[]>;
  updateCourseStatus(id: string, status: string, studentId?: string | null): Promise<void>;
}