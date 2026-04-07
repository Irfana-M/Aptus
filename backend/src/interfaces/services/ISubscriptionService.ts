import type { StudentDocument } from "../../models/student/student.model";

export interface ISubscriptionService {
  activateSubscription(studentId: string, planCode: string, subjectCount: number, paymentIntentId: string, sessionId: string, paymentId?: string): Promise<StudentDocument>;
  getActivePlans(): Promise<unknown[]>;
  calculateMonthlyCost(planCode: string, numberOfSubjects: number): Promise<{
    planCode: string;
    planName: string;
    numberOfSubjects: number;
    pricePerSession: number;
    sessionsPerWeek: number;
    sessionsPerMonth: number;
    monthlyCost: number;
    currency: string;
  }>;
}
