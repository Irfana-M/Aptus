import type { IBaseRepository } from "./IBaseRepository";
import type { AuthUser, StudentAuthUser } from "../auth/auth.interface";
import type { StudentProfile } from "../models/student.interface";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { StudentPaginationParams } from "@/dto/shared/paginationTypes";

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
  findStudentProfileById(id: string): Promise<unknown>;
}
