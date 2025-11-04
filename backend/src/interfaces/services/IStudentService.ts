import type { AuthUser } from "../auth/auth.interface";

export interface IStudentService {
  registerStudent(data: AuthUser): Promise<AuthUser>;
  
}