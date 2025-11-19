import type {
  TrialClassRequestDto,
  TrialClassResponseDto,
} from "@/dto/student/trialClassDTO";

export interface ITrialClassService {
  requestTrialClass(
    data: TrialClassRequestDto,
    studentId: string
  ): Promise<TrialClassResponseDto>;

  getStudentTrialClasses(studentId: string): Promise<TrialClassResponseDto[]>;

  getTrialClassById(
    id: string,
    studentId: string
  ): Promise<TrialClassResponseDto>;

  updateTrialClass(
    trialClassId: string,
    studentId: string,
    updates: {
      subject?: string;
      preferredDate?: string;
      preferredTime?: string;
      notes?: string;
    }
  ): Promise<TrialClassResponseDto>;
}
