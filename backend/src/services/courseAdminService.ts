import { injectable, inject } from "inversify";
import mongoose from "mongoose";
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
import type { IEnrollmentRepository } from "@/interfaces/repositories/IEnrollmentRepository";
import type { IEnrollmentLinkRepository } from "@/interfaces/repositories/IEnrollmentLinkRepository";

@injectable()
export class CourseAdminService implements ICourseAdminService {
  constructor(
    @inject(TYPES.IMentorRepository) private mentorRepo: IMentorRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: ICourseRepository,
    @inject(TYPES.ISubjectService) private subjectService: ISubjectService,
    @inject(TYPES.IGradeService) private gradeService: IGradeService,
    @inject(TYPES.IAvailabilityService) private availabilityService: IAvailabilityService,
    @inject(TYPES.IEnrollmentRepository) private enrollmentRepo: IEnrollmentRepository,
    @inject(TYPES.IEnrollmentLinkRepository) private enrollmentLinkRepo: IEnrollmentLinkRepository
  ) {}


  async getAvailableMentorsForCourse(params: {
    gradeId: string;
    subjectId: string;
    dayOfWeek?: number;
    timeSlot?: string;
    days?: string[];
    excludeCourseId?: string;
  }): Promise<{ matches: AvailableMentorDto[], alternates: AvailableMentorDto[] }> {
    // 1. Robustly resolve Subject
    let subjectDoc = null;
    if (params.subjectId && mongoose.Types.ObjectId.isValid(params.subjectId)) {
        subjectDoc = await Subject.findById(params.subjectId).lean();
    } else if (params.subjectId) {
        subjectDoc = await Subject.findOne({ subjectName: new RegExp(`^${params.subjectId}$`, 'i') }).lean();
    }
    
    if (!subjectDoc) {
        throw new AppError(`Subject '${params.subjectId || 'unknown'}' not found`, HttpStatusCode.NOT_FOUND);
    }

    // 2. Robustly resolve Grade ID (needed for availabilityService)
    let resolvedGradeId = params.gradeId;
    if (params.gradeId && !mongoose.Types.ObjectId.isValid(params.gradeId)) {
        const resolvedGradeIdFromModel = await this.gradeService.findByName(params.gradeId);
        if (resolvedGradeIdFromModel) {
            resolvedGradeId = resolvedGradeIdFromModel;
        } else {
             throw new AppError(`Grade '${params.gradeId}' not found`, HttpStatusCode.NOT_FOUND);
        }
    }

    // Normalize params
    const days = params.days || (params.dayOfWeek !== undefined ? [this.getDayName(params.dayOfWeek)] : []);
    const timeSlot = params.timeSlot || "";

    const { matches, alternates } = await this.availabilityService.findMatchingMentors(
       subjectDoc._id.toString(),
       resolvedGradeId || "", // Ensure it's never undefined
       days,
       timeSlot,
       params.excludeCourseId
    );

    return {
        matches: matches.map((m: MentorProfile) => new AvailableMentorDto(m, subjectDoc!.subjectName)),
        alternates: alternates.map((m: MentorProfile) => new AvailableMentorDto(m, subjectDoc!.subjectName))
    };
  }

  private getDayName(dayIndex: number): string {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex] || "";
  }

  async createEnrollment(data: CreateCourseParams) {
    // 1. Resolve Subject ID if name provided
    let subjectId = data.subjectId;
    if (subjectId && !mongoose.Types.ObjectId.isValid(subjectId)) {
        const subjectDoc = await Subject.findOne({ subjectName: new RegExp(`^${subjectId}$`, 'i') }).lean();
        if (subjectDoc) {
            subjectId = subjectDoc._id.toString();
        } else {
             throw new AppError(`Subject '${subjectId}' not found`, HttpStatusCode.NOT_FOUND);
        }
    } else if (subjectId) {
        const subjectDoc = await Subject.findById(subjectId).lean();
        if (!subjectDoc) throw new AppError(`Subject '${subjectId}' not found`, HttpStatusCode.NOT_FOUND);
    }

    // 2. Resolve Grade ID if name provided
    let gradeId = data.gradeId;
    if (gradeId && !mongoose.Types.ObjectId.isValid(gradeId)) {
        const resolvedId = await this.gradeService.findByName(gradeId);
        if (resolvedId) {
            gradeId = resolvedId;
        } else {
             throw new AppError(`Grade '${gradeId}' not found`, HttpStatusCode.NOT_FOUND);
        }
    }

    // Check for conflicts ONLY if day and time are provided (Legacy) or schedule is provided
    let days: string[] = [];
    let timeSlot = "";

    if (data.schedule) {
       days = data.schedule.days;
       timeSlot = data.schedule.timeSlot;
    } else if (data.dayOfWeek !== undefined) {
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

    const course = await this.courseRepo.createEnrollment({
      ...data,
      mentor: data.mentorId,
      student: data.studentId, 
      subject: subjectId,
      grade: gradeId,
      status: "booked", 
      schedule: schedule, 
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    if (!course) {
        throw new AppError("Failed to create enrollment", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    // If a student is assigned, also create an enrollment record
    if (data.studentId) {
       try {
           logger.info(`Creating enrollment record for student ${data.studentId} in course ${course._id}`);
           await this.enrollmentLinkRepo.create({
               student: data.studentId as any,
               course: course._id as any,
               status: 'active' as any,
           });
       } catch (error) {
           logger.error(`Failed to create enrollment record for student ${data.studentId} in course ${course._id}:`, error);
       }
    }

    return course;
  }

  async updateOneToOneCourse(id: string, data: Partial<CreateCourseParams>) {
    // 1. Resolve IDs if names are passed (similar to create)
    let subjectId = data.subjectId;
    if (subjectId && !/^[0-9a-fA-F]{24}$/.test(subjectId)) {
      const resolvedId = await this.subjectService.findByName(subjectId);
      if (resolvedId) subjectId = resolvedId;
    }

    let gradeId = data.gradeId;
    if (gradeId && !/^[0-9a-fA-F]{24}$/.test(gradeId)) {
      const resolvedId = await this.gradeService.findByName(gradeId);
      if (resolvedId) gradeId = resolvedId;
    }

    // 2. Prepare update object
    logger.info(`Updating course ${id} with data:`, data);
    const updateData: any = { ...data };
    
    if (subjectId) {
      updateData.subject = subjectId;
      delete updateData.subjectId;
    }
    if (gradeId) {
      updateData.grade = gradeId;
      delete updateData.gradeId;
    }
    if (data.mentorId) {
      updateData.mentor = data.mentorId;
      delete updateData.mentorId;
    }
    if (data.studentId) {
      updateData.student = data.studentId;
      delete updateData.studentId;
    } else if (data.studentId === null || data.studentId === "") {
      updateData.student = null;
      delete updateData.studentId;
    }
    
    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);

    // Book slots if schedule is provided and it's a new thing? 
    // For now, let's just update the document.
    
    logger.debug(`Final update object for course ${id}:`, updateData);
    const updated = await this.courseRepo.updateCourse(id, updateData);
    if (!updated) {
      throw new AppError("Course not found", HttpStatusCode.NOT_FOUND);
    }
    return updated;
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