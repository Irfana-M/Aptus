import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { AuthUser } from "../auth/auth.interface";
import type { StudentProfile, StudentRegisterInput } from "../models/student.interface";
import type { OnboardingEvent } from "../../enums/studentOnboarding.enum";

export interface IStudentService {
  registerStudent(data: AuthUser): Promise<AuthUser>;
  findStudentByEmail(email: string): Promise<AuthUser | null>;
  createStudent(studentData: StudentRegisterInput): Promise<AuthUser>;
  getById(id: string): Promise<StudentBaseResponseDto | null>;
  updateProfile(id: string, data: Partial<StudentProfile>): Promise<StudentProfile>;
  getStudentProfileById(id: string): Promise<StudentProfile | null>;
  advanceOnboarding(studentId: string, event: OnboardingEvent): Promise<void>;
  updatePreferences(studentId: string, preferences: { subjectId: string; slots: any[] }[]): Promise<StudentProfile>;
  requestMentor(studentId: string, subjectId: string, mentorId: string): Promise<void>;
}