import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository.js";
import type { IStudentSubscription, ISubscriptionPlan } from "../interfaces/models/subscription.interface.js";
import { StudentSubscriptionModel } from "../models/subscription/studentSubscription.model.js";
import { SubscriptionPlanModel } from "../models/subscription/subscriptionPlan.model.js";
import type { ISubscriptionRepository } from "../interfaces/repositories/ISubscriptionRepository.js";
import { Types } from "mongoose";

@injectable()
export class SubscriptionRepository extends BaseRepository<IStudentSubscription> implements ISubscriptionRepository {
  constructor() {
    super(StudentSubscriptionModel);
  }

  async findPlanById(planId: string): Promise<ISubscriptionPlan | null> {
    return await SubscriptionPlanModel.findById(planId).lean().exec() as unknown as ISubscriptionPlan | null;
  }

  async findPlanByCode(planCode: string): Promise<ISubscriptionPlan | null> {
    return await SubscriptionPlanModel.findOne({ planCode }).lean().exec() as unknown as ISubscriptionPlan | null;
  }

  async findActiveSubscriptionByStudent(studentId: string): Promise<IStudentSubscription | null> {
    return await this.model.findOne({
      studentId: new Types.ObjectId(studentId),
      status: 'active',
      endDate: { $gt: new Date() }
    }).lean().exec() as unknown as IStudentSubscription | null;
  }

  async findActivePlans(): Promise<ISubscriptionPlan[]> {
    return await SubscriptionPlanModel.find({ isActive: true }).lean().exec() as unknown as ISubscriptionPlan[];
  }
}
