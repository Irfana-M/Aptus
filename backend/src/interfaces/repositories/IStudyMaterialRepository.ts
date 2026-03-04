import type { IStudyMaterial } from "../models/studyMaterial.interface.js";
import type { IBaseRepository } from "./IBaseRepository.js";

export interface IStudyMaterialRepository extends IBaseRepository<IStudyMaterial> {
  findBySessionId(sessionId: string): Promise<IStudyMaterial[]>;
  findByStudentId(studentId: string): Promise<IStudyMaterial[]>;
  findByCourseId(courseId: string): Promise<IStudyMaterial[]>;
  findByMentor(mentorId: string, materialType?: 'study_material' | 'assignment'): Promise<IStudyMaterial[]>;
  findAssignmentsForStudent(studentId: string): Promise<IStudyMaterial[]>;
  findUpcomingAssignments(daysAhead: number): Promise<IStudyMaterial[]>;
  delete(id: string): Promise<boolean>;
}
