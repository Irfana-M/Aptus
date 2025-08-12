import type { StudentProfile } from "./student.interface";

export interface IStudentRepository {
    findByEmail(email: string): Promise<StudentProfile | null>;
    findById(id: string): Promise<StudentProfile | null>;
    updateProfile(id: string,data: Partial<StudentProfile>): Promise<StudentProfile | null>;
    blockStudent(id: string): Promise<boolean>;
    markUserVerified(email: string): Promise<void>;
}