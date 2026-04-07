import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import { Enrollment } from "../models/enrollment.model";
import type { IEnrollment } from "../models/enrollment.model";
import type { IStudentEnrollmentRepository } from "../interfaces/repositories/IStudentEnrollmentRepository";

@injectable()
export class StudentEnrollmentRepository extends BaseRepository<IEnrollment> implements IStudentEnrollmentRepository {
  constructor() {
    super(Enrollment);
  }

  async findActiveByCourseId(courseId: string): Promise<IEnrollment[]> {
    return await this.model.find({ course: courseId, status: 'active' }).lean() as unknown as IEnrollment[];
  }
}
