export interface TrialClassRequestDto {
  subject: string;
  preferredDate: string;
  preferredTime: string;
}

export interface TrialClassResponseDto {
  id: string;
  student: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber?: string | undefined;
  } | string; 
  subject: {
    id: string;
    subjectName: string;
    syllabus: string;
    grade: number;
  };
  status: "requested" | "assigned" | "completed" | "cancelled";
  preferredDate: string;
  preferredTime: string;
  scheduledDateTime?: string | undefined;
  notes?: string | undefined;
   feedback?: {
    rating: number;
    comment: string;
    submittedAt: string;
  } | undefined;
  mentor?: {
    id: string;
    name: string;
    email: string;
  } | undefined;
  meetLink?: string | undefined;
  sessionType?: string;
  trialClassId?: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}