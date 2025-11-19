// dto/subject.dto.ts
export interface SubjectResponseDto {
  id: string;
  subjectName: string;
  syllabus: string;
  grade: number;
}

export interface SubjectsListResponseDto {
  success: boolean;
  message: string;
  data: SubjectResponseDto[];
}