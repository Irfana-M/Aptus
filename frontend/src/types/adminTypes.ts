import type { StudentBaseResponseDto } from "./studentTypes";

export interface AddStudentRequestDto {
  fullName: string;
  email: string;
  phoneNumber?: string;
  department?: string;
  batch?: string;
}

export interface AddStudentResponseDto {
  success: boolean;
  message: string;
  data: StudentBaseResponseDto;
}