import type { ClientSession } from "mongoose";
import type { IBaseRepository } from "./IBaseRepository.js";
import type { AuthUser, StudentAuthUser } from "../auth/auth.interface.js";
import type { StudentProfile } from "../models/student.interface.js";
import type { StudentBaseResponseDto } from "@/dtos/auth/UserResponseDTO.js";
import type { StudentPaginationParams } from "@/dtos/shared/paginationTypes.js";

export interface StudentPaginatedResult {
  students: unknown[];
  total: number;
}

export interface IStudentRepository extends IBaseRepository<StudentAuthUser> {
  findByEmail(email: string): Promise<StudentAuthUser| null>;
  findById(id: string): Promise<StudentAuthUser | null>;
  updateProfile(
    id: string,
    data: Partial<StudentProfile>
  ): Promise<StudentProfile | null>;
  blockStudent(id: string): Promise<StudentAuthUser>;
  unblockStudent(id: string): Promise<StudentAuthUser>;
  markUserVerified(email: string): Promise<void>;
  createUser(data: AuthUser): Promise<AuthUser>;
  findAllStudents(): Promise<StudentBaseResponseDto[]>;
  findAllStudentsPaginated(params: StudentPaginationParams): Promise<StudentPaginatedResult>;
  findAllWithTrialStats(page: number, limit: number): Promise<{
    students: unknown[];
    totalStudents: number;
  }>;
  findStudentProfileById(id: string, traceId?: string): Promise<unknown>;
  updatePreferredTimeSlotStatus(
    studentId: string,
    subjectId: string,
    status: 'mentor_assigned' | 'mentor_requested' | 'preferences_submitted',
    mentorId?: string
  ): Promise<void>;
  searchStudents(query: string): Promise<unknown[]>;
  incrementCancellationCount(studentId: string, session?: ClientSession): Promise<void>;
}
