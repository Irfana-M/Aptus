import type { IBaseRepository } from "./IBaseRepository";
import type { AuthUser, StudentAuthUser } from "../auth/auth.interface";
import type { StudentProfile } from "../models/student.interface";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";

export interface IStudentRepository extends IBaseRepository<StudentAuthUser> {
  findByEmail(email: string): Promise<StudentAuthUser| null>;
  findById(id: string): Promise<StudentAuthUser | null>;
  updateProfile(
    id: string,
    data: Partial<StudentProfile>
  ): Promise<StudentProfile | null>;
  blockStudent(id: string): Promise<boolean>;
  markUserVerified(email: string): Promise<void>;
  createUser(data: AuthUser): Promise<AuthUser>;
  findAllStudents(): Promise<StudentBaseResponseDto[]>;
}
