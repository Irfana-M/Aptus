import { injectable, inject } from 'inversify';
import { TYPES } from '../../types';
import { AppError } from '../../utils/AppError';
import { HttpStatusCode } from '../../constants/httpStatus';
import type { IPricingService } from '../../interfaces/services/IPricingService';
import type { IStudentRepository } from '../../interfaces/repositories/IStudentRepository';
import type { ISubscriptionRepository } from '../../interfaces/repositories/ISubscriptionRepository';

@injectable()
export class PricingService implements IPricingService {
  constructor(
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository,
    @inject(TYPES.ISubscriptionRepository) private _subscriptionRepo: ISubscriptionRepository
  ) {}
  
  async calculateSessionCost(studentId: string): Promise<{ cost: number; currency: string }> {
   
    const student = await this._studentRepo.findById(studentId);
    if (!student || !student.activeSubscriptionId) {
       throw new AppError("Active subscription required for pricing", HttpStatusCode.FORBIDDEN);
    }

    // 2. Get Subscription
    const subscription = await this._subscriptionRepo.findById(student.activeSubscriptionId.toString());
    if (!subscription) {
      throw new AppError("Subscription not found", HttpStatusCode.NOT_FOUND);
    }

    // 3. Get Plan
    const plan = await this._subscriptionRepo.findPlanById(subscription.planId.toString());
    if (!plan) {
      throw new AppError("Subscription plan not found", HttpStatusCode.NOT_FOUND);
    }

    return {
      cost: plan.pricePerSession,
      currency: plan.currency
    };
  }
}
