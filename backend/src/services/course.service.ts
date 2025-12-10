import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { ICourseService } from "../interfaces/services/ICourseService";
import type { ICourseRepository } from "../interfaces/repositories/ICourseRepository";

@injectable()
export class CourseService implements ICourseService {
  constructor(
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository
  ) {}

  async getAvailableCourses(filters: any): Promise<any[]> {
    return await this._courseRepository.findAvailableCourses(filters);
  }

  async getCourseById(id: string): Promise<any | null> {
    return await this._courseRepository.findById(id);
  }
}
