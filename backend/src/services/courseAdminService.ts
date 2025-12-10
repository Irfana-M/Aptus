import { injectable, inject } from "inversify";
import { TYPES } from "@/types";
import type { IMentorRepository } from "@/interfaces/repositories/IMentorRepository";
import { AvailableMentorDto } from "@/dto/mentor/AvailableMentorDTO";
import { Subject } from "@/models/subject.model"
import { AppError } from "@/utils/AppError";
import { HttpStatusCode } from "@/constants/httpStatus";
import type { ICourseAdminService } from "@/interfaces/services/ICourseAdminService";
import type { ICourseRepository } from "@/interfaces/repositories/ICourseRepository";
import type { GradeResponseDto } from "@/dto/student/grade.dto";
import type { SubjectResponseDto } from "@/dto/student/subject.dto";
import type { ISubjectService } from "@/interfaces/services/ISubjectService";
import type { IGradeService } from "@/interfaces/services/IGradeService";
import type { CoursePaginationParams, PaginatedResponse } from "@/dto/shared/paginationTypes";
import { logger } from "@/utils/logger";

@injectable()
export class CourseAdminService implements ICourseAdminService {
  constructor(
    @inject(TYPES.IMentorRepository) private mentorRepo: IMentorRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: ICourseRepository,
    @inject(TYPES.ISubjectService) private subjectService: ISubjectService,
        @inject(TYPES.IGradeService) private gradeService: IGradeService
  ) {}

  async getAvailableMentorsForCourse(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
  }): Promise<AvailableMentorDto[]> {
    const subjectDoc = await Subject.findById(params.subjectId).lean();
    if (!subjectDoc) throw new AppError("Subject not found", HttpStatusCode.NOT_FOUND);

    const rawMentors = await this.mentorRepo.findAvailableMentors({
      gradeId: params.gradeId,
      subjectId: params.subjectId,
      dayOfWeek: params.dayOfWeek,
      timeSlot: params.timeSlot,
    });

    return rawMentors.map(
      (m) => new AvailableMentorDto(m, subjectDoc.subjectName)
    );
  }

  async createOneToOneCourse(data: any) {
    // Check for conflicts ONLY if day and time are provided
    if (data.dayOfWeek !== undefined && data.timeSlot) {
      const conflict = await this.courseRepo.findActiveConflict({
        mentorId: data.mentor,
        dayOfWeek: data.dayOfWeek,
        timeSlot: data.timeSlot,
      });

      if (conflict) {
        throw new AppError(
          "This slot was booked in the last few seconds. Please try again.",
          HttpStatusCode.CONFLICT
        );
      }
    }

    const course = await this.courseRepo.createOneToOneCourse({
      ...data,
      mentor: data.mentorId,
      subject: data.subjectId,
      grade: data.gradeId,
      status: "available",
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    return course;
  }

  async getAllOneToOneCourses() {
    return await this.courseRepo.getAllOneToOneCourses();
  }

  async getAllCoursesPaginated(params: CoursePaginationParams): Promise<PaginatedResponse<any>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;

      logger.info(`Fetching paginated courses - page: ${page}, limit: ${limit}, search: ${params.search}, status: ${params.status}`);

      const result = await this.courseRepo.findAllCoursesPaginated(params);

      const totalPages = Math.ceil(result.total / limit);

      logger.info(`Retrieved ${result.courses.length} courses (page ${page}/${totalPages}, total: ${result.total})`);

      return {
        success: true,
        data: result.courses,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error fetching paginated courses:", error);
      throw new AppError(
        "Failed to fetch courses",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllGrades(): Promise<GradeResponseDto[]> {
    return await this.gradeService.getAllGrades();
  }

  async getSubjectsByGrade(gradeId: string): Promise<SubjectResponseDto[]> {
    return await this.subjectService.getSubjectsByGrade(gradeId);
  }
}