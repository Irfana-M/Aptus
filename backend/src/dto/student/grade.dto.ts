export interface GradeResponseDto {
  id: string;
  name: string;
  syllabus: string;
  grade: number;
}

export interface GradesListResponseDto {
  success: boolean;
  message: string;
  data: GradeResponseDto[];
}