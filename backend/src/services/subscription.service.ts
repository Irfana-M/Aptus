import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { IStudentRepository } from '../interfaces/repositories/IStudentRepository';
import type { IStudentService } from '../interfaces/services/IStudentService';
import { InternalEventEmitter } from '../utils/InternalEventEmitter';
import { EVENTS } from '../utils/InternalEventEmitter';
import { logger } from '../utils/logger';
import type { StudentDocument } from '../models/student/student.model';
import type { ISubscriptionService } from '../interfaces/services/ISubscriptionService';

@injectable()
export class SubscriptionService implements ISubscriptionService {
  constructor(
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository,
    @inject(TYPES.IStudentService) private studentService: IStudentService,
    @inject(TYPES.InternalEventEmitter) private eventEmitter: InternalEventEmitter
  ) {}

  async activateSubscription(
    studentId: string, 
    plan: string, 
    subjectCount: number, 
    paymentIntentId: string, 
    sessionId: string
  ): Promise<any> {
    logger.info(`Activating subscription for student: ${studentId}, plan: ${plan}`);

    const startDate = new Date();
    const renewalDate = new Date(startDate);
    const expiryDate = new Date();
    const endDate = new Date();
    
    if (plan === 'monthly') {
      renewalDate.setMonth(renewalDate.getMonth() + 1);
      endDate.setTime(renewalDate.getTime());
    } else if (plan === 'yearly') {
      renewalDate.setFullYear(renewalDate.getFullYear() + 1);
      endDate.setTime(renewalDate.getTime());
    }
    
    expiryDate.setTime(renewalDate.getTime());
    expiryDate.setDate(expiryDate.getDate() + 3);

    const student = await this.studentRepository.updateById(studentId, {
      hasPaid: true,
      subscription: {
        plan: plan as "monthly" | "yearly",
        startDate,
        endDate,
        renewalDate,
        expiryDate,
        subjectCount,
        status: 'active',
        paymentIntentId,
        sessionId
      }
    }) as unknown as StudentDocument;

    // Advance onboarding state
    try {
        await this.studentService.advanceOnboarding(studentId, 'SUBSCRIBED' as any);
    } catch (e) {
        logger.error(`Failed to advance onboarding for student ${studentId} to SUBSCRIBED`, e);
    }

    // Emit event for notifications
    this.eventEmitter.emit(EVENTS.SUBSCRIPTION_ACTIVATED, {
      studentId,
      studentName: student?.fullName || "Student",
      plan,
      amount: 0 // Amount could be passed if needed for analytics
    });

    return student;
  }
}
