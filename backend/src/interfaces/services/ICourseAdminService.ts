import { AvailableMentorDto } from "@/dto/mentor/AvailableMentorDTO";
import type { GradeResponseDto } from "@/dto/student/grade.dto";
import type { SubjectResponseDto } from "@/dto/student/subject.dto";
import type { CoursePaginationParams, PaginatedResponse } from "@/dto/shared/paginationTypes";

export interface CreateCourseParams {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    studentId: string;
    schedule?: { days: string[]; timeSlot: string };
    dayOfWeek?: number;
    timeSlot?: string;
    startDate: string | Date;
    endDate: string | Date;
    fee?: number;
}

export interface ICourseAdminService {
  getAllOneToOneCourses(): Promise<unknown[]>; // TODO: Replace any with Course
  getAllCoursesPaginated(params: CoursePaginationParams): Promise<PaginatedResponse<unknown>>; // TODO: Replace any with Course

  getAvailableMentorsForCourse(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
    days?: string[];
  }): Promise<{ matches: AvailableMentorDto[], alternates: AvailableMentorDto[] }>;

  createOneToOneCourse(data: CreateCourseParams): Promise<unknown>; // TODO: Replace any with Course

  getAllGrades(): Promise<GradeResponseDto[]>;

  getSubjectsByGrade(gradeId: string): Promise<SubjectResponseDto[]>;
}