import type { IStudentSubscription, ISubscriptionPlan } from "../models/subscription.interface";
import type { IBaseRepository } from "./IBaseRepository";

export interface ISubscriptionRepository extends IBaseRepository<IStudentSubscription> {
  findPlanById(planId: string): Promise<ISubscriptionPlan | null>;
  findPlanByCode(planCode: string): Promise<ISubscriptionPlan | null>;
  findActiveSubscriptionByStudent(studentId: string): Promise<IStudentSubscription | null>;
  findActivePlans(): Promise<ISubscriptionPlan[]>;
}
