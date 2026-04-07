import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { ICourseService } from "../interfaces/services/ICourseService";
import type { ICourseRepository } from "../interfaces/repositories/ICourseRepository";
import type { CoursePaginationParams, PaginatedResponse } from "@/dtos/shared/paginationTypes";
import { formatPaginatedResult, getPaginationParams } from "@/utils/pagination.util";

@injectable()
export class CourseService implements ICourseService {
  constructor(
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository
  ) {}

  async getAvailableCourses(params: CoursePaginationParams): Promise<PaginatedResponse<unknown>> {
    const { page, limit } = getPaginationParams(params);
    const result = await this._courseRepository.findAllCoursesPaginated(params);
    return formatPaginatedResult(result.courses, result.total, { page, limit });
  }

  async getCourseById(id: string): Promise<unknown | null> {
    return await this._courseRepository.findById(id);
  }

  async getCoursesByStudent(studentId: string): Promise<unknown[]> {
    return await this._courseRepository.findByStudent(studentId);
  }

  async getCoursesByMentor(mentorId: string): Promise<unknown[]> {
    return await this._courseRepository.findByMentor(mentorId);
  }
}
