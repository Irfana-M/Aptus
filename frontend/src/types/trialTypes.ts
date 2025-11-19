export interface Grade {
  id: string;
  name: string;
  syllabus: string;
}

export interface Subject {
  id: string;
  subjectName: string;
  gradeId: string;
  syllabus: string;
  grade?: number; 
}

export interface TrialClassStudent {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
}

export interface TrialClassSubject {
  id: string;
  subjectName: string;
  syllabus: string;
  grade: number;
}

export interface TrialClassMentor {
  id: string;
  name: string;
  email: string;
}

export interface TrialClassFeedback {
  rating: number;
  comment: string;
  submittedAt: string;
}


export interface TrialClass {
  id: string;
  student: TrialClassStudent;
  subject: TrialClassSubject;
  preferredDate: string;
  preferredTime: string;
  status: "requested" | "assigned" | "completed" | "cancelled" | "pending" | "scheduled";
  assignedMentor?: TrialClassMentor;
  mentor?: TrialClassMentor; 
  meetLink?: string;
  notes?: string;
  scheduledDateTime?: string;
  feedback?: TrialClassFeedback;
  createdAt: string;
  updatedAt: string;
}


export type TrialClassResponse = TrialClass;


export interface TrialClassRequest {
  studentName: string;
  email: string;
  grade: string;
  syllabus: string;
  subject: string;
  preferredDate: string;
  preferredTime: string;
  notes?: string;
}

export interface AssignMentorRequest {
  mentorId: string;
  scheduledDateTime: string;
  meetLink: string;
}

export interface FeedbackRequest {
  rating: number;
  comment: string;
}

export type TrialStatus = TrialClass["status"];