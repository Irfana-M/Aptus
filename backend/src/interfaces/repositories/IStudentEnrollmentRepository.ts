
import type { IEnrollment } from "../../models/enrollment.model.js";

export interface IStudentEnrollmentRepository {
  findActiveByCourseId(courseId: string): Promise<IEnrollment[]>;
}
