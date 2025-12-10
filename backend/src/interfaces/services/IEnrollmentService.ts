import type { IEnrollment } from "../../models/enrollment.model";

export interface IEnrollmentService {
  enrollInCourse(studentId: string, courseId: string): Promise<IEnrollment>;
  getStudentEnrollments(studentId: string): Promise<IEnrollment[]>;
  updateEnrollmentStatus(enrollmentId: string, status: "pending_payment" | "active" | "cancelled"): Promise<IEnrollment | null>;
}
