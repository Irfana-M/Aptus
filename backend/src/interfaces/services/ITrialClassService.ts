import type {
  TrialClassRequestDto,
  TrialClassResponseDto,
} from "../../dtos/student/trialClassDTO";

export interface ITrialClassService {
  requestTrialClass(
    data: TrialClassRequestDto,
    studentId: string
  ): Promise<TrialClassResponseDto>;

  getStudentTrialClasses(studentId: string, page?: number, limit?: number): Promise<{ items: TrialClassResponseDto[]; total: number }>;

  getTrialClassById(
    id: string,
    studentId: string
  ): Promise<TrialClassResponseDto>;

  getAvailableSlots(
    subjectId: string,
    date: string
  ): Promise<Record<string, unknown>>;

  autoAssignMentor(
    subjectId: string,
    date: string,
    timeSlot: string
  ): Promise<import("../models/mentor.interface").MentorProfile>;

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

  getMentorTrialClasses(mentorId: string, page?: number, limit?: number): Promise<{ items: TrialClassResponseDto[]; total: number }>;
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
