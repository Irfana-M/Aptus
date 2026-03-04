import type { ICourse } from "../../models/course.model.js";
import type { CoursePaginationParams, CoursePaginatedResult } from "../../dtos/shared/paginationTypes.js";

export interface CreateEnrollmentDto {
  grade: string;
  subject: string;
  mentor: string;
  student?: string;
  schedule?: {
    days: string[];
    timeSlot: string;
  };
  startDate: Date;
  endDate: Date;
  fee?: number;
  status?: string;
}

import type { ClientSession } from "mongoose";

export interface IEnrollmentRepository {
  create(data: Partial<ICourse>, session?: ClientSession): Promise<ICourse>;
  findById(id: string): Promise<ICourse | null>;
  findByStudent(studentId: string): Promise<ICourse[]>;
  findByMentor(mentorId: string): Promise<ICourse[]>;
  findAllPaginated(params: CoursePaginationParams): Promise<CoursePaginatedResult>;
  findAvailable(filters: Record<string, unknown>): Promise<ICourse[]>;
  updateStatus(id: string, status: string, studentId?: string | null): Promise<void>;
  update(id: string, data: Partial<CreateEnrollmentDto>): Promise<ICourse | null>;
  
  // Legacy Enrollment specific methods (if still needed)
  countActiveByStudent(studentId: string): Promise<number>;
}
