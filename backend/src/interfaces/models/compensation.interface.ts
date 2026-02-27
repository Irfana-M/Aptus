import { Schema, Document } from "mongoose";

export interface IMentorRate extends Document {
  mentorId: Schema.Types.ObjectId;
  defaultRate: number;
  currency: string;
  subjectRules: Map<string, number>; 
  multipliers: {
    group: number;
    oneToOne: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMentorEarning extends Document {
  sessionId: Schema.Types.ObjectId;
  attendanceId: Schema.Types.ObjectId;
  mentorId: Schema.Types.ObjectId;
  amount: number;
  baseRateUsed: number;
  currency: string;
  payoutStatus: 'pending' | 'in_cycle' | 'paid';
  payoutCycleId?: Schema.Types.ObjectId;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPayoutCycle extends Document {
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  totalAmount: number;
  currency: string;
  mentorEarnings: Schema.Types.ObjectId[];
  processedAt?: Date;
  processedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExperienceSlab {
  minYears: number;
  maxYears: number;
  multiplier: number;
}

export interface IMentorSalaryConfig extends Document {
  baseRateOneToOne: number;
  baseRateGroup: number;
  experienceSlabs: IExperienceSlab[];
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionEarning {
  sessionId: Schema.Types.ObjectId;
  sessionType: 'group' | 'one-to-one';
  date: Date;
  baseRate: number;
  multiplier: number;
  finalAmount: number;
}

export interface IMentorSalary extends Document {
  mentorId: Schema.Types.ObjectId;
  month: number; 
  year: number;
  totalSessions: number;
  oneToOneSessions: number;
  groupSessions: number;
  baseEarnings: number;
  bonusAmount: number;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'pending_approval' | 'processed' | 'paid';
  sessionEarnings: ISessionEarning[];
  generatedAt: Date;
  approvedAt?: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
