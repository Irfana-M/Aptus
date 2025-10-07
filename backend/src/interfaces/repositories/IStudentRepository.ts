import type { AuthUser } from "../auth/auth.interface.js";
import type { StudentProfile } from "../models/student.interface.js";

export interface IStudentRepository {
    findByEmail(email: string): Promise<AuthUser | null>;
    findById(id: string): Promise<AuthUser | null>;
    updateProfile(id: string,data: Partial<StudentProfile>): Promise<StudentProfile | null>;
    blockStudent(id: string): Promise<boolean>;
    markUserVerified(email: string): Promise<void>;
    createUser(data: AuthUser): Promise<AuthUser>;
}