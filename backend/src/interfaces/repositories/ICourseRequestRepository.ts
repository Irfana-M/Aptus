import type { CourseRequestDocument } from "../../models/courseRequest.model.js";
import type { IBaseRepository } from "./IBaseRepository.js";

export interface ICourseRequestRepository extends IBaseRepository<CourseRequestDocument> {
  updateStatus(id: string, status: string): Promise<CourseRequestDocument | null>;
  findByStudent(studentId: string): Promise<CourseRequestDocument[]>;
}
