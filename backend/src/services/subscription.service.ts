import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';
import { TYPES } from '../types';
import type { IStudentRepository } from '../interfaces/repositories/IStudentRepository';
import type { IStudentService } from '../interfaces/services/IStudentService';
import { InternalEventEmitter } from '../utils/InternalEventEmitter';
import { EVENTS } from '../utils/InternalEventEmitter';
import { logger } from '../utils/logger';
import type { StudentDocument } from '../models/student/student.model';
import type { ISubscriptionService } from '../interfaces/services/ISubscriptionService';
import type { ISubscriptionRepository } from '../interfaces/repositories/ISubscriptionRepository';

@injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository,
    @inject(TYPES.IStudentService) private studentService: IStudentService,
    @inject(TYPES.InternalEventEmitter) private eventEmitter: InternalEventEmitter,
    @inject(TYPES.ISubscriptionRepository) private subscriptionRepository: ISubscriptionRepository
  ) {}

  async activateSubscription(
    studentId: string, 
    planCode: string, 
    subjectCount: number, 
    paymentIntentId: string, 
    sessionId: string,
    paymentId?: string
  ): Promise<StudentDocument> {
    logger.info(`Activating subscription for student: ${studentId}, planCode: ${planCode}, paymentId: ${paymentId}`);

    const planDetails = await this.subscriptionRepository.findPlanByCode(planCode);
    
    
    const planType = planDetails?.sessionType === 'GROUP' ? 'basic' : 'premium';
    
    
    const planDuration = planCode.toLowerCase().includes('yearly') ? 'yearly' : 'monthly';

    const startDate = new Date();
    const renewalDate = new Date(startDate);
    const expiryDate = new Date();
    
    if (planDuration === 'monthly') {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
    } else if (planDuration === 'yearly') {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    }
    
    const endDate = new Date(renewalDate.getTime());
    expiryDate.setTime(renewalDate.getTime());
    expiryDate.setDate(expiryDate.getDate() + 3);

    const student = await this.studentRepository.updateById(studentId, {
      hasPaid: true,
      subscription: {
        plan: planDuration as "monthly" | "yearly",
        planCode,
        planType,
        startDate,
        endDate,
        renewalDate,
        expiryDate,
        subjectCount,
        status: 'active',
        paymentIntentId,
        paymentId: paymentId as any,
        sessionId
      }
    }) as unknown as StudentDocument;

    // Advance onboarding state
    try {
        const { StudentOnboardingStatus } = await import('../enums/studentOnboarding.enum');
        await this.studentService.advanceOnboarding(studentId, StudentOnboardingStatus.SUBSCRIBED as any);
    } catch (e) {
        logger.error(`Failed to advance onboarding for student ${studentId} to SUBSCRIBED`, e);
    }

    // Emit event for notifications
    this.eventEmitter.emit(EVENTS.SUBSCRIPTION_ACTIVATED, {
      studentId,
      studentName: student?.fullName || "Student",
      plan: planCode,
      amount: 0 
    });

    return student;
  }

  /**
   * Get all active subscription plans
   */
  async getActivePlans(): Promise<unknown[]> {
    return await this.subscriptionRepository.findActivePlans();
  }

  /**
   * Calculate monthly subscription cost
   */
  async calculateMonthlyCost(
    planCode: string,
    numberOfSubjects: number
  ): Promise<{
    planCode: string;
    planName: string;
    numberOfSubjects: number;
    pricePerSession: number;
    sessionsPerWeek: number;
    sessionsPerMonth: number;
    monthlyCost: number;
    currency: string;
  }> {
    // Fetch plan via repository
    const plan = await this.subscriptionRepository.findPlanByCode(planCode);
    if (!plan) {
      throw new Error(`Subscription plan '${planCode}' not found or inactive`);
    }

    // Validation
    if (numberOfSubjects > plan.maxSubjects) {
      throw new Error(
        `Cannot select ${numberOfSubjects} subjects. Maximum allowed for ${plan.name} is ${plan.maxSubjects}`
      );
    }

    if (numberOfSubjects < 1) {
      throw new Error('Number of subjects must be at least 1');
    }

    // Calculate
    const sessionsPerWeek = numberOfSubjects * plan.sessionsPerSubjectPerWeek;
    const sessionsPerMonth = sessionsPerWeek * 4; 
    const monthlyCost = sessionsPerMonth * plan.pricePerSession;

    logger.info(
      `Cost calculation: ${numberOfSubjects} subjects × ${plan.sessionsPerSubjectPerWeek} sessions/week × ${plan.pricePerSession} INR × 4 weeks = ${monthlyCost} INR`
    );

    return {
      planCode: plan.planCode,
      planName: plan.name,
      numberOfSubjects,
      pricePerSession: plan.pricePerSession,
      sessionsPerWeek,
      sessionsPerMonth,
      monthlyCost,
      currency: plan.currency
    };
  }
}
