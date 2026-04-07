
import type { IEnrollment } from "../../models/enrollment.model";

export interface IStudentEnrollmentRepository {
  findActiveByCourseId(courseId: string): Promise<IEnrollment[]>;
}
