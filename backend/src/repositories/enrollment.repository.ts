import { injectable, inject } from "inversify";
import { type ClientSession } from "mongoose";
import { Course, type ICourse } from "../models/course.model";
import type { IEnrollmentRepository, CreateEnrollmentDto } from "../interfaces/repositories/IEnrollmentRepository";
import { BaseRepository } from "./baseRepository";
import type { CoursePaginationParams, CoursePaginatedResult } from "@/dtos/shared/paginationTypes";
import { TYPES } from "../types";
import type { ICourseRepository, CreateOneToOneCourseDto } from "../interfaces/repositories/ICourseRepository";

@injectable()
export class EnrollmentRepository extends BaseRepository<ICourse> implements IEnrollmentRepository {
  constructor(
    @inject(TYPES.ICourseRepository) private courseRepository: ICourseRepository
  ) {
    super(Course);
  }

  async create(data: Partial<ICourse>, _session?: ClientSession): Promise<ICourse> {
    const course = await this.courseRepository.createEnrollment(data as unknown as CreateOneToOneCourseDto);
    if (!course) throw new Error("Failed to create enrollment");
    return course;
  }

  async findById(id: string): Promise<ICourse | null> {
    return this.courseRepository.findById(id);
  }

  async findByStudent(studentId: string): Promise<ICourse[]> {
    return this.courseRepository.findByStudent(studentId) as Promise<ICourse[]>;
  }

  async findByMentor(mentorId: string): Promise<ICourse[]> {
    return this.courseRepository.findByMentor(mentorId) as Promise<ICourse[]>;
  }

  async findAllPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult> {
    return this.courseRepository.findAllCoursesPaginated(params);
  }

  async findAvailable(filters: Record<string, unknown>): Promise<ICourse[]> {
    return this.courseRepository.findAvailableCourses(filters) as Promise<ICourse[]>;
  }

  async updateStatus(id: string, status: string, studentId?: string | null): Promise<void> {
    await this.courseRepository.updateCourseStatus(id, status, studentId);
  }

  async update(id: string, data: Partial<CreateEnrollmentDto>): Promise<ICourse | null> {
    return this.courseRepository.updateCourse(id, data as unknown as Partial<CreateOneToOneCourseDto>);
  }

  async countActiveByStudent(studentId: string): Promise<number> {
    // If CourseRepository doesn't expose this exact query, we might need to add it or perform it here via the repo
    // For now, delegating to the repo would be ideal if the method existed, but we can't change the interface easily?
    // User said "Do NOT delete existing repositories or services".
    // I can add methods to ICourseRepository if needed, but per "Adapter" pattern, 
    // if the logic is unique to "Enrollment" view, maybe we keep logical implementation here using repo methods?
    // However, strict delegation suggests we use repo methods.
    // CourseRepository doesn't have `countActiveByStudent`.
    // I'll leave the implementation here but use `CourseModel` (via super or direct) OR add to CourseRepository.
    // Given "EnrollmentRepository must internally call CourseRepository" instruction is primarily for data access.
    // I will use direct implementation for this specific query if missing, OR better, adapt it.
    
    // Actually, I can use the BaseRepository methods available if I strictly used `super`.
    // But `CourseRepository` might have custom logic.
    // I'll keep the direct Mongoose call for this specific query as it's a "new" method not in CourseRepo, 
    // UNLESS I add it to CourseRepo. The constraints say "Introduce Enrollment terminology WITHOUT modifying existing Course logic" - implying minimize changes to Course.
    return await Course.countDocuments({ student: studentId, status: { $in: ["booked", "ongoing"] }, isActive: true });
  }
}
