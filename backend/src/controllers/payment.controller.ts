import type { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { IPaymentService } from '../interfaces/services/payment.service.interface';
import type { IWalletService } from '../interfaces/services/IWalletService';
import type { IStudentRepository } from '../interfaces/repositories/IStudentRepository';
import type { ICourseRequestRepository } from '../interfaces/repositories/ICourseRequestRepository';
import type { IStudentService } from '../interfaces/services/IStudentService';
import type { ISubscriptionService } from '../interfaces/services/ISubscriptionService';
import type { StudentDocument } from '../models/student/student.model';
import type { OnboardingEvent } from '../enums/studentOnboarding.enum';

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface StudentWithAcademics {
  academicDetails?: {
    grade?: string;
  };
}

@injectable()
export class PaymentController {
  constructor(
    @inject(TYPES.IPaymentService) private paymentService: IPaymentService,
    @inject(TYPES.IWalletService) private walletService: IWalletService,
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository,
    @inject(TYPES.ICourseRequestRepository) private courseRequestRepository: ICourseRequestRepository,
    @inject(TYPES.IStudentService) private studentService: IStudentService,
    @inject(TYPES.ISubscriptionService) private subscriptionService: ISubscriptionService
  ) {}

  createIntent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { planType, subjectCount = 1 } = req.body;
      let amount = 0;

     
      if (planType === 'monthly') {
        amount = subjectCount * 500 * 100; 
      } else if (planType === 'yearly') {
        
        const baseAmount = subjectCount >= 4 ? 20000 : subjectCount * 5000;
        amount = baseAmount * 100;
      } else {
        res.status(400).json({ message: 'Invalid plan type' });
        return;
      }

      const paymentIntent = await this.paymentService.createPaymentIntent(amount);

      res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  };

  confirmPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentIntentId, studentId, planType: rawPlanType, subjectCount = 1 } = req.body;

      if (!studentId) {
        res.status(400).json({ message: 'Student ID required to activate subscription' });
        return;
      }

      // Normalize plan type
      let planType = rawPlanType;
      if (rawPlanType.toLowerCase() === 'basic') planType = 'monthly';
      if (rawPlanType.toLowerCase() === 'premium') planType = 'yearly';

      const paymentIntent = await this.paymentService.verifyPaymentIntent(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        const student = await this.subscriptionService.activateSubscription(
          studentId,
          planType,
          subjectCount,
          paymentIntentId,
          paymentIntent.id
        );

        res.status(200).json({ success: true, message: 'Subscription activated' });
      } else {
        res.status(400).json({ success: false, message: 'Payment not successful' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  };

  payWithWallet = async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentId, planType, subjectCount = 1, availability = [], subjects = [] } = req.body;

      if (!studentId || !planType) {
        res.status(400).json({ message: 'Student ID and Plan Type required' });
        return;
      }

      let amount = 0;
      // Pricing logic
      if (planType === 'monthly') {
        amount = subjectCount * 500;
      } else if (planType === 'yearly') {
        // Tiered Yearly: 1:5k, 2:10k, 3:15k, 4+:20k
        amount = subjectCount >= 4 ? 20000 : subjectCount * 5000;
      } else {
        res.status(400).json({ message: 'Invalid plan type' });
        return;
      }

      // 1. Check & Debit Wallet
      // This throws error if insufficient balance
      await this.walletService.debitWallet(
        studentId, 
        amount, 
        'PURCHASE', 
        `Subscription payment for ${planType} plan`
      );

      const student = await this.subscriptionService.activateSubscription(
        studentId,
        planType,
        subjectCount,
        'WALLET_PAYMENT',
        'WALLET_SESSION'
      );

      res.status(200).json({ success: true, message: 'Subscription activated via Wallet' });

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message === 'Insufficient wallet balance') {
         res.status(400).json({ message: 'Insufficient wallet balance' });
      } else {
         res.status(500).json({ message });
      }
    }
  };

  getAllPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { PaymentModel } = await import('../models/payment.model');
      const payments = await PaymentModel.find()
        .populate('studentId', 'fullName email')
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, data: payments });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message });
    }
  };

  getStudentPayments = async (req: Request, res: Response): Promise<void> => {
      try {
          const { studentId } = req.params;
          console.log(`[DEBUG] getStudentPayments called for studentId: ${studentId}`);

          const { PaymentModel } = await import('../models/payment.model');
          let payments = await PaymentModel.find({ studentId }).sort({ createdAt: -1 });
          
          console.log(`[DEBUG] Found ${payments.length} existing payments`);

          // Self-healing: If no payments found but student has active subscription, create the missing record
          if (payments.length === 0) {
              const student = (await this.studentRepository.findById(studentId as string)) as unknown as StudentDocument;
              console.log(`[DEBUG] Student found: ${!!student}, hasPaid: ${student?.hasPaid}, paymentIntentId: ${student?.subscription?.paymentIntentId}`);
              
              if (student && student.subscription && student.subscription.paymentIntentId && student.hasPaid) {
                  // Avoid creating duplicates if paymentIntentId is effectively 'WALLET_PAYMENT' or similar placeholder if handled differently,
                  // but for now we assume missing record means we should create it.
                  
                  // Double check we don't already have this transaction (by transactionId)
                  const existing = await PaymentModel.findOne({ transactionId: student.subscription.paymentIntentId || 'dummy_tx_id' });
                  console.log(`[DEBUG] Existing payment record for transactionId ${student.subscription.paymentIntentId}: ${!!existing}`);
                  
                  if (!existing) {
                      console.log('🔧 Self-healing: Creating missing payment record for student', studentId);
                      
                      const planType = student.subscription.plan || 'monthly';
                      const subCount = student.subscription.subjectCount || 1;
                      const amount = planType === 'yearly' 
                        ? (subCount >= 4 ? 20000 : subCount * 5000)
                        : (subCount * 500);
                      
                      const newPayment = await PaymentModel.create({
                          studentId,
                          amount,
                          currency: 'inr',
                          status: 'completed',
                          method: 'stripe', // Defaulting to stripe if unknown, usually safe for legacy
                          transactionId: student.subscription.paymentIntentId || `TX-MISSING-${Date.now()}`,
                          invoiceId: `INV-HEAL-${Date.now()}`,
                          purpose: `Subscription - ${planType}`,
                          metadata: { planType, studentId, note: 'Self-healed record' },
                          createdAt: student.subscription.startDate || new Date()
                      });
                      
                      payments = [newPayment];
                      console.log('[DEBUG] Payment record created and added to result response');
                  }
              }
          }

          res.status(200).json({ success: true, data: payments });
      } catch (error: unknown) {
          console.error('[DEBUG] Error in getStudentPayments:', error);
          const message = error instanceof Error ? error.message : "Unknown error";
          res.status(500).json({ message });
      }
  };
}
