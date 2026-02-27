import type { IAssignmentSubmission } from "../models/studyMaterial.interface";
import type { IBaseRepository } from "./IBaseRepository";

export interface IAssignmentSubmissionRepository extends IBaseRepository<IAssignmentSubmission> {
  findByMaterialId(materialId: string): Promise<IAssignmentSubmission[]>;
  findByStudentId(studentId: string): Promise<IAssignmentSubmission[]>;
  findByMaterialAndStudent(materialId: string, studentId: string): Promise<IAssignmentSubmission | null>;
  addFeedback(submissionId: string, feedback: string): Promise<IAssignmentSubmission | null>;
}
