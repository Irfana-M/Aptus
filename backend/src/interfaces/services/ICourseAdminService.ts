import { AvailableMentorDto } from "@/dto/mentor/AvailableMentorDTO";
import type { GradeResponseDto } from "@/dto/student/grade.dto";
import type { SubjectResponseDto } from "@/dto/student/subject.dto";
import type { CoursePaginationParams, PaginatedResponse } from "@/dto/shared/paginationTypes";

export interface ICourseAdminService {
  getAllOneToOneCourses(): Promise<any[]>;
  getAllCoursesPaginated(params: CoursePaginationParams): Promise<PaginatedResponse<any>>;
  getAvailableMentorsForCourse(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
  }): Promise<AvailableMentorDto[]>;

  createOneToOneCourse(data: {
    grade: string;
    subject: string;
    mentor: string;
    dayOfWeek: number;
    timeSlot: string;
    startDate: string;
    endDate: string;
    fee: number;
  }): Promise<any>;

  getAllGrades(): Promise<GradeResponseDto[]>;

  getSubjectsByGrade(gradeId: string): Promise<SubjectResponseDto[]>;
}