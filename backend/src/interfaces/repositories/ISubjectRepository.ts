import type { ISubject } from "@/models/subject.model.js";
import type { IBaseRepository } from "./IBaseRepository.js";

export interface ISubjectRepository extends IBaseRepository<ISubject> {
  findAllActive(): Promise<ISubject[]>;
  findByGradeAndSyllabus(grade: number, syllabus: string): Promise<ISubject[]>;
  findByGrade(gradeId: string): Promise<ISubject[]>;
}