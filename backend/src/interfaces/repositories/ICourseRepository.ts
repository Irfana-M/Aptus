import { Types } from "mongoose";
import type { CoursePaginationParams } from "@/dto/shared/paginationTypes";

export interface CreateOneToOneCourseDto {
  grade: string;
  subject: string;
  mentor: string;
  dayOfWeek: number;
  timeSlot: string;
  startDate: Date;
  endDate: Date;
  fee?: number;
}

export interface CoursePaginatedResult {
  courses: any[];
  total: number;
}

export interface ICourseRepository {
  /**
   * Check if a mentor already has a booked/active course on this day + time slot
   */
  findActiveConflict(params: {
    mentorId: string;
    dayOfWeek?: number;
    timeSlot?: string;
  }): Promise<any | null>;

  /**
   * Create a new 1:1 course (admin creates it as "available")
   */
  createOneToOneCourse(data: CreateOneToOneCourseDto): Promise<any>;
  getAllOneToOneCourses(): Promise<any[]>;
  findAllCoursesPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult>;
  findAvailableCourses(filters: any): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  updateCourseStatus(id: string, status: string, studentId?: string | null): Promise<void>;
}