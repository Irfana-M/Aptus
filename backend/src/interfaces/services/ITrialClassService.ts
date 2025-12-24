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

  submitFeedback(
    trialClassId: string,
    studentId: string,
    feedback: {
      rating: number;
      comment?: string;
    }
  ): Promise<TrialClassResponseDto>;

  getMentorTrialClasses(mentorId: string): Promise<TrialClassResponseDto[]>;
  getTodayTrialClasses(mentorId: string): Promise<TrialClassResponseDto[]>;
  getTrialClassStats(mentorId: string): Promise<{ total: number; completed: number; upcoming: number }>;
  updateTrialClassStatus(trialClassId: string, status: string, reason?: string): Promise<TrialClassResponseDto>;
  
  submitMentorFeedback(
    trialClassId: string,
    mentorId: string,
    feedback: {
      rating: number;
      comment?: string;
    }
  ): Promise<TrialClassResponseDto>;
}
