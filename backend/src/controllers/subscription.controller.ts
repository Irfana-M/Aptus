import type { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { ISubscriptionService } from '../interfaces/services/ISubscriptionService';
import { HttpStatusCode } from '../constants/httpStatus';

@injectable()
export class SubscriptionController {
  constructor(
    @inject(TYPES.ISubscriptionService) private subscriptionService: ISubscriptionService
  ) {}

 
  async getActivePlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = await this.subscriptionService.getActivePlans();
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: plans
      });
    } catch (error: unknown) {
      const appError = error as { message?: string };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch subscription plans',
        error: appError.message
      });
    }
  }


  async calculateCost(req: Request, res: Response): Promise<void> {
    try {
      const { planCode, numberOfSubjects } = req.body;

      if (!planCode || !numberOfSubjects) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          message: 'planCode and numberOfSubjects are required'
        });
        return;
      }

      const result = await this.subscriptionService.calculateMonthlyCost(
        planCode,
        numberOfSubjects
      );

      res.status(HttpStatusCode.OK).json(result);
    } catch (error: unknown) {
      const appError = error as { message?: string };
      res.status(HttpStatusCode.BAD_REQUEST).json({
        message: appError.message || 'Failed to calculate cost'
      });
    }
  }
}
