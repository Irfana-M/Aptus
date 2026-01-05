import { Schema, Document } from "mongoose";

export interface IMentorRate extends Document {
  mentorId: Schema.Types.ObjectId;
  defaultRate: number;
  currency: string;
  subjectRules: Map<string, number>; // subjectId -> rate
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
