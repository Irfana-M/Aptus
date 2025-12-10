import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { AuthUser } from "../auth/auth.interface";

export interface IStudentService {
  registerStudent(data: AuthUser): Promise<AuthUser>;
  findStudentByEmail(email: string): Promise<any>;
  createStudent(studentData: any): Promise<any>;
  getById(id: string): Promise<any>;
  updateProfile(id: string, data: any): Promise<any>;
  getStudentProfileById(id: string): Promise<any>;
}