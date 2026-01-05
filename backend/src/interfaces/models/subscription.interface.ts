import { Schema, Document } from "mongoose";

export interface IEntitlements {
  maxSubjects: number;
  sessionsPerSubjectPerWeek: number;
  totalSessionsPerWeek: number; // New: Global weekly limit
  canChooseMentorSlot: boolean;
  allowedSessionTypes: ('group' | 'one-to-one')[]; // New: Supports hybrid
}

export interface ISubscriptionPlan extends Document {
  name: string;
  type: 'monthly' | 'yearly';
  price: number;
  currency: string;
  entitlements: IEntitlements;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEnrolledSubject {
  subjectId: Schema.Types.ObjectId;
  enrolledAt: Date;
}

export interface ISubscriptionUsage {
  enrolledSubjects: IEnrolledSubject[]; // New: Structured metadata
  weeklySessionUsage: Map<string, number>; // key: subjectId, value: count
  totalWeeklyUsage: number; // New: Tracks global consumption
  currentWeekStartDate: Date; // New: Monday 00:00 alignment
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
