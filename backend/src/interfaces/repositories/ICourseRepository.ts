import type { CoursePaginationParams } from "@/dtos/shared/paginationTypes.js";
import type { ICourse } from "@/models/course.model.js";

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
  startDate: Date;
  endDate: Date;
  fee?: number | undefined;
  status?: string | undefined;
  courseType?: "one-to-one" | "group";
  maxStudents?: number;
  enrolledStudents?: number;
}

export interface CoursePaginatedResult {
  courses: ICourse[];
  total: number;
}

import type { IBaseRepository } from "./IBaseRepository.js";
import type { ClientSession } from "mongoose";

export interface ICourseRepository extends IBaseRepository<ICourse> {
  /**
   * Check if a mentor already has a booked/active course on this day + time slot
   */
  /**
   * Create a new enrollment (legacy course)
   */
  createEnrollment(data: CreateOneToOneCourseDto, session?: ClientSession): Promise<ICourse | null>;
  getAllOneToOneCourses(): Promise<ICourse[]>;
  findAllCoursesPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult>;
  findAvailableCourses(filters: Record<string, unknown>): Promise<ICourse[]>;
  findById(id: string, session?: ClientSession): Promise<ICourse | null>;
  findByStudent(studentId: string): Promise<ICourse[]>;
  findByMentor(mentorId: string): Promise<unknown[]>;
  findOneToOneByMentor(mentorId: string): Promise<unknown[]>;
  findGroupBatchesByMentor(mentorId: string): Promise<unknown[]>;
  findActiveCoursesByMentor(mentorId: string): Promise<ICourse[]>;
  updateCourseStatus(id: string, status: string, studentId?: string | null): Promise<void>;
  updateCourse(id: string, data: Partial<CreateOneToOneCourseDto>): Promise<ICourse | null>;
  findMatchingGroupCourse(params: {
    mentorId: string;
    subjectId: string;
    gradeId: string;
    days: string[];
    timeSlot: string;
  }): Promise<ICourse | null>;
}