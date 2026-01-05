import type { CoursePaginationParams } from "@/dto/shared/paginationTypes";
import type { ICourse } from "@/models/course.model";

export interface CreateOneToOneCourseDto {
  grade: string;
  subject: string;
  mentor: string;
  student?: string | undefined; // Optional if course is just "available" initially, but here we seem to set it
  dayOfWeek?: number | undefined;
  timeSlot?: string | undefined;
  schedule?: {
    days: string[];
    timeSlot: string;
  } | undefined;
  startDate: Date;
  endDate: Date;
  fee?: number | undefined;
  status?: string | undefined;
}

export interface CoursePaginatedResult {
  courses: ICourse[];
  total: number;
}

import type { IBaseRepository } from "./IBaseRepository";

export interface ICourseRepository extends IBaseRepository<ICourse> {
  /**
   * Check if a mentor already has a booked/active course on this day + time slot
   */
  /**
   * Create a new enrollment (legacy course)
   */
  createEnrollment(data: CreateOneToOneCourseDto): Promise<ICourse | null>;
  getAllOneToOneCourses(): Promise<ICourse[]>;
  findAllCoursesPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult>;
  findAvailableCourses(filters: Record<string, unknown>): Promise<ICourse[]>;
  findById(id: string): Promise<ICourse | null>;
  findByStudent(studentId: string): Promise<ICourse[]>;
  findByMentor(mentorId: string): Promise<ICourse[]>;
  updateCourseStatus(id: string, status: string, studentId?: string | null): Promise<void>;
  updateCourse(id: string, data: Partial<CreateOneToOneCourseDto>): Promise<ICourse | null>;
}