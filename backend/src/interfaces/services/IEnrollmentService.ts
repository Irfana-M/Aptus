import type { PaginationParams, PaginatedResponse } from "@/dtos/shared/paginationTypes.js";
import type { IEnrollment } from "../../models/enrollment.model.js";

export interface IEnrollmentService {
  enrollInCourse(studentId: string, courseId: string): Promise<IEnrollment>;
  getStudentEnrollments(studentId: string): Promise<IEnrollment[]>;
  updateEnrollmentStatus(enrollmentId: string, status: "pending_payment" | "active" | "cancelled"): Promise<IEnrollment | null>;
  getAllEnrollments(): Promise<IEnrollment[]>;
  getAllEnrollmentsPaginated(params: PaginationParams): Promise<PaginatedResponse<IEnrollment>>;
}
