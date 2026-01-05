import type { IEnrollment } from "../../models/enrollment.model";
import type { IBaseRepository } from "./IBaseRepository";

export interface IEnrollmentLinkRepository extends IBaseRepository<IEnrollment> {
  findByStudentAndCourse(studentId: string, courseId: string): Promise<IEnrollment | null>;
  findByStudent(studentId: string): Promise<IEnrollment[]>;
  findByIdAndUpdate(id: string, update: Partial<IEnrollment>): Promise<IEnrollment | null>;
  countActiveByStudent(studentId: string): Promise<number>;
}
