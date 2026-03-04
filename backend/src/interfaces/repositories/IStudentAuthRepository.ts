import type { IAuthRepository } from "../auth/IAuthRepository.js";
import type { AuthUser, StudentAuthUser } from "../auth/auth.interface.js";
import type { StudentProfile } from "../models/student.interface.js";

export interface IStudentAuthRepository extends IAuthRepository<StudentAuthUser> {
  comparePassword(user: AuthUser, password: string): Promise<boolean>;
  updatePassword(email: string, hashedPassword: string): Promise<void>;
  updateProfile(
    id: string,
    data: Partial<StudentProfile>
  ): Promise<StudentProfile | null>;
  listAllStudents(): Promise<StudentProfile[]>;
  findByReferralCode(code: string): Promise<StudentAuthUser | null>;
}
