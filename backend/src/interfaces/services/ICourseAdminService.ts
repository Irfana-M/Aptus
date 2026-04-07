import { AvailableMentorDto } from "../../dtos/mentor/AvailableMentorDTO";
import type { GradeResponseDto } from "../../dtos/student/grade.dto";
import type { SubjectResponseDto } from "../../dtos/student/subject.dto";
import type { CoursePaginationParams,PaginatedResponse } from "../../dtos/shared/paginationTypes";
export interface CreateCourseParams {
    gradeId: string;
    subjectId: string;
    mentorId: string;
    studentId?: string | undefined;
    schedule?: { days: string[]; timeSlot: string } | undefined;
    dayOfWeek?: number | undefined;
    timeSlot?: string | undefined;
    startDate: string | Date;
    endDate: string | Date;
    fee?: number | undefined;
    courseType?: "one-to-one" | "group";
    maxStudents?: number;
}

export interface ICourseAdminService {
  getAllOneToOneCourses(): Promise<unknown[]>; // TODO: Replace any with Course
  getAllCoursesPaginated(params: CoursePaginationParams): Promise<PaginatedResponse<unknown>>; // TODO: Replace any with Course

  getAvailableMentorsForCourse(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number | undefined;
    timeSlot?: string | undefined;
    days?: string[] | undefined;
    excludeCourseId?: string | undefined;
  }): Promise<{ matches: AvailableMentorDto[], alternates: AvailableMentorDto[] }>;

  createEnrollment(data: CreateCourseParams): Promise<unknown>; // TODO: Replace any with Course
  updateOneToOneCourse(id: string, data: Partial<CreateCourseParams>): Promise<unknown>;

  getAllGrades(): Promise<GradeResponseDto[]>;

  getSubjectsByGrade(gradeId: string): Promise<SubjectResponseDto[]>;

  enrollStudentToCourse(courseId: string, studentId: string): Promise<unknown>;
  unenrollStudentFromCourse(courseId: string, studentId: string): Promise<unknown>;
}