import type { SubjectResponseDto } from "@/dto/student/subject.dto";

export interface ISubjectService {
  getAllSubjects(): Promise<SubjectResponseDto[]>;
  getSubjectsByGrade(gradeId: string): Promise<SubjectResponseDto[]>;
  getSubjectsByGradeAndSyllabus(grade: number, syllabus: string): Promise<SubjectResponseDto[]>;
}