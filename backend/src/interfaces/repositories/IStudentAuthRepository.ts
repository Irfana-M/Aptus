import type { IAuthRepository } from "../auth/IAuthRepository";
import type { AuthUser } from "../auth/auth.interface";
import type { StudentProfile } from "../models/student.interface";

export interface IStudentAuthRepository extends IAuthRepository {
  comparePassword(user: AuthUser, password: string): Promise<boolean>;
  blockStudent(id: string): Promise<boolean>;
  listAllStudents(): Promise<StudentProfile[]>;
  block(id: string): Promise<boolean>;
}