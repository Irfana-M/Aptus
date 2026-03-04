import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository.js";
import { Enrollment } from "../models/enrollment.model.js";
import type { IEnrollment } from "../models/enrollment.model.js";
import type { IStudentEnrollmentRepository } from "../interfaces/repositories/IStudentEnrollmentRepository.js";

@injectable()
export class StudentEnrollmentRepository extends BaseRepository<IEnrollment> implements IStudentEnrollmentRepository {
  constructor() {
    super(Enrollment);
  }

  async findActiveByCourseId(courseId: string): Promise<IEnrollment[]> {
    return await this.model.find({ course: courseId, status: 'active' }).lean() as unknown as IEnrollment[];
  }
}
