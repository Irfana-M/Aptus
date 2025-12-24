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
import type { IAvailabilityService } from "@/interfaces/services/IAvailabilityService";
import type { MentorProfile } from "@/interfaces/models/mentor.interface";
import type { CreateCourseParams } from "@/interfaces/services/ICourseAdminService";

@injectable()
export class CourseAdminService implements ICourseAdminService {
  constructor(
    @inject(TYPES.IMentorRepository) private mentorRepo: IMentorRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: ICourseRepository,
    @inject(TYPES.ISubjectService) private subjectService: ISubjectService,
    @inject(TYPES.IGradeService) private gradeService: IGradeService,
    @inject(TYPES.IAvailabilityService) private availabilityService: IAvailabilityService
  ) {}


  async getAvailableMentorsForCourse(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
    days?: string[]; // Added support for days
  }): Promise<{ matches: AvailableMentorDto[], alternates: AvailableMentorDto[] }> {
    const subjectDoc = await Subject.findById(params.subjectId).lean();
    if (!subjectDoc) throw new AppError("Subject not found", HttpStatusCode.NOT_FOUND);

    // Normalize params
    const days = params.days || (params.dayOfWeek ? [this.getDayName(params.dayOfWeek)] : []);
    const timeSlot = params.timeSlot || "";

    const { matches, alternates } = await this.availabilityService.findMatchingMentors(
       params.subjectId,
       params.gradeId,
       days,
       timeSlot
    );

    return {
        matches: matches.map((m: MentorProfile) => new AvailableMentorDto(m, subjectDoc.subjectName)),
        alternates: alternates.map((m: MentorProfile) => new AvailableMentorDto(m, subjectDoc.subjectName))
    };
  }

  private getDayName(dayIndex: number): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex] || "";
  }

  async createOneToOneCourse(data: CreateCourseParams) {
    // 1. Resolve Subject ID if name provided
    let subjectId = data.subjectId;
    if (subjectId && !/^[0-9a-fA-F]{24}$/.test(subjectId)) {
        const resolvedId = await this.subjectService.findByName(subjectId);
        if (resolvedId) {
            subjectId = resolvedId;
        } else {
             // Fallback or throw? If strictly required, throw.
             // But existing behavior might have crashed, so let's log and keep original to see if it works (unlikely)
             // Or better, assume it's a name and fail if not found.
             throw new AppError(`Subject '${subjectId}' not found`, HttpStatusCode.BAD_REQUEST);
        }
    }

    // 2. Resolve Grade ID if name provided
    let gradeId = data.gradeId;
    if (gradeId && !/^[0-9a-fA-F]{24}$/.test(gradeId)) {
        const resolvedId = await this.gradeService.findByName(gradeId);
        if (resolvedId) {
            gradeId = resolvedId;
        } else {
             // Try lenient match for Grade? e.g. "Grade 10" -> "10"
             // For now throw.
             throw new AppError(`Grade '${gradeId}' not found`, HttpStatusCode.BAD_REQUEST);
        }
    }

    // Check for conflicts ONLY if day and time are provided (Legacy) or schedule is provided
    let days: string[] = [];
    let timeSlot = "";

    if (data.schedule) {
       days = data.schedule.days; // ["Monday", "Friday"]
       timeSlot = data.schedule.timeSlot; // "10:00-11:00"
    } else if (data.dayOfWeek !== undefined) {
       // Legacy fallback
       // Map dayOfWeek index to string
       const dayName = this.getDayName(data.dayOfWeek);
       if (dayName) days.push(dayName);
       
       if (data.timeSlot) {
           timeSlot = data.timeSlot;
       }
    }

    if (days.length > 0 && timeSlot) {
        await this.availabilityService.bookSlots(data.mentorId, days, timeSlot);
    }
    
    // Construct schedule object for model if creating from legacy params
    const schedule = data.schedule || {
        days: days,
        timeSlot: timeSlot
    };

    const course = await this.courseRepo.createOneToOneCourse({
      ...data,
      mentor: data.mentorId,
      student: data.studentId, // Map studentId to student
      subject: subjectId,
      grade: gradeId,
      status: "available", 
      schedule: schedule, 
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    return course;
  }

  async getAllOneToOneCourses() {
    return await this.courseRepo.getAllOneToOneCourses();
  }

  async getAllCoursesPaginated(params: CoursePaginationParams): Promise<PaginatedResponse<unknown>> { // TODO: Replace any with Course type
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