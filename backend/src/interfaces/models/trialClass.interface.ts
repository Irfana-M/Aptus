export interface TrialClass {
  id: string;
  studentId: string;
  subjectId: string;
  mentorId?: string;
  status: "requested" | "assigned" | "completed";
  preferredDate: Date; 
  preferredTime: string;
  meetLink?: string;
  feedback?: {
    rating?: number;
    comment?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateTrialClass {
  studentId: string;
  subjectId: string;
  preferredDate: Date;
  preferredTime: string;
  status?: "requested" | "assigned" | "completed";
}