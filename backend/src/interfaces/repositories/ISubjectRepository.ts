import type { ISubject } from "@/models/subject.model";

export interface ISubjectRepository {
  findAllActive(): Promise<ISubject[]>;
  findByGradeAndSyllabus(grade: number, syllabus: string): Promise<ISubject[]>;
  findByGrade(gradeId: string): Promise<ISubject[]>;
  findById(id: string): Promise<ISubject | null>;
}