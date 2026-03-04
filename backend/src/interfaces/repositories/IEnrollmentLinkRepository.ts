import type { IEnrollment } from "../../models/enrollment.model.js";
import type { IBaseRepository } from "./IBaseRepository.js";

export interface IEnrollmentLinkRepository extends IBaseRepository<IEnrollment> {
  findByStudentAndCourse(studentId: string, courseId: string): Promise<IEnrollment | null>;
  findByStudent(studentId: string): Promise<IEnrollment[]>;
  findByCourse(courseId: string): Promise<IEnrollment[]>;
  findByIdAndUpdate(id: string, update: Partial<IEnrollment>): Promise<IEnrollment | null>;
  countActiveByStudent(studentId: string): Promise<number>;
  deleteByFilter(filter: Record<string, unknown>): Promise<boolean>;
}
