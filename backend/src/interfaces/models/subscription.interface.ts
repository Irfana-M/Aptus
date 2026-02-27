import { Schema, Document } from "mongoose";

export interface IEntitlements {
  maxSubjects: number;
  sessionsPerSubjectPerWeek: number;
  totalSessionsPerWeek: number; 
  canChooseMentorSlot: boolean;
  allowedSessionTypes: ('group' | 'one-to-one')[]; 
}

export interface ISubscriptionPlan extends Document {
  planCode: string;
  name: string;
  maxSubjects: number;
  sessionsPerSubjectPerWeek: number;
  totalSessionsPerWeek: number;
  maxStudentsAllowed: number;
  sessionType: 'GROUP' | 'ONE_TO_ONE';
  attendanceRequired: boolean;
  rescheduleAllowed: boolean;
  mentorChoice: boolean;
  hasStudyMaterials: boolean;
  hasExams: boolean;
  allowedDays: string[];
  pricePerSession: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrolledSubject {
  subjectId: Schema.Types.ObjectId;
  enrolledAt: Date;
}

export interface ISubscriptionUsage {
  enrolledSubjects: IEnrolledSubject[]; 
  weeklySessionUsage: Map<string, number>; 
  totalWeeklyUsage: number; 
  currentWeekStartDate: Date; 
}

export interface IStudentSubscription extends Document {
  studentId: Schema.Types.ObjectId;
  planId: Schema.Types.ObjectId;
  paymentId?: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  usage: ISubscriptionUsage;
  createdAt: Date;
  updatedAt: Date;
}
