export interface SubjectResponseDto {
  id: string;
  subjectName: string;
  syllabus: string;
  grade: string;
}

export interface SubjectsListResponseDto {
  success: boolean;
  message: string;
  data: SubjectResponseDto[];
}