import type { AuthUser } from "../auth/auth.interface";

export interface IStudentService {
  registerStudent(data: AuthUser): Promise<AuthUser>;
  findStudentByEmail(email: string): Promise<any>;
  createStudent(studentData: any): Promise<any>

}