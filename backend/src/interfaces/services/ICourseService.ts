import type { CoursePaginationParams, PaginatedResponse } from "@/dtos/shared/paginationTypes";

export interface ICourseService {
  getAvailableCourses(params: CoursePaginationParams): Promise<PaginatedResponse<unknown>>;
  getCourseById(id: string): Promise<unknown | null>;
  getCoursesByStudent(studentId: string): Promise<unknown[]>;
  getCoursesByMentor(mentorId: string): Promise<unknown[]>;
}
