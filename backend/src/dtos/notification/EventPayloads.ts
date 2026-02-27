
export interface IMentorApprovedPayload {
  mentorId: string;
  mentorName: string;
  email: string;
  status: 'approved' | 'rejected';
  reason?: string;
}

export interface IMentorAssignedPayload {
  studentId: string;
  studentName: string;
  mentorId: string;
  mentorName: string;
  subjectName: string;
}

export interface ITrialMentorAssignedPayload {
  trialClassId: string;
  studentId: string;
  mentorId: string;
  mentorName: string;
  subjectName: string;
  scheduledDate: Date | string;
  scheduledTime: string;
  meetLink: string;
}

export interface ISessionScheduledPayload {
  sessionId: string;
  studentId: string;
  mentorId: string;
  subjectName: string;
  startTime: Date;
  endTime: Date;
}

export interface ISessionCancelledPayload {
  sessionId: string;
  studentId: string;
  mentorId: string;
  subjectName: string;
  reason?: string;
}

export interface ISubscriptionActivatedPayload {
  studentId: string;
  studentName: string;
  plan: string;
  amount: number;
}

export interface IPreferencesSubmittedPayload {
  studentId: string;
  studentName: string;
  subjectName?: string;
  adminId: string;
}

export interface IMentorRequestSubmittedPayload {
  studentId: string;
  studentName: string;
  mentorName: string;
  subjectName: string;
  adminId: string;
}
