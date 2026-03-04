import type { GradeResponseDto } from "../../dtos/student/grade.dto.js";

export interface IGradeService {
  getAllGrades(): Promise<GradeResponseDto[]>;
  getGradesBySyllabus(syllabus: string): Promise<GradeResponseDto[]>;
  findByName(name: string): Promise<string | null>;
}