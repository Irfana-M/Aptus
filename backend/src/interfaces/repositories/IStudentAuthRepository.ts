import type { IAuthRepository } from "../auth/IAuthRepository";
import type { AuthUser } from "../auth/auth.interface";
import type { StudentProfile } from "../models/student.interface";

export interface IStudentAuthRepository extends IAuthRepository {
  comparePassword(user: AuthUser, password: string): Promise<boolean>;
  updatePassword(email: string, hashedPassword: string): Promise<void>;
  updateProfile(
    id: string,
    data: Partial<StudentProfile>
  ): Promise<StudentProfile | null>;
  listAllStudents(): Promise<StudentProfile[]>;
}
