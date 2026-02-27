import type { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { IPaymentService } from '@/interfaces/services/payment.service.interface';
import type { IStudentService } from "@/interfaces/services/IStudentService";
import type { ISubscriptionService } from "@/interfaces/services/ISubscriptionService";
import { getPaginationParams, formatPaginatedResult } from '@/utils/pagination.util';

@injectable()
export class PaymentController {
  constructor(
    @inject(TYPES.IPaymentService) private paymentService: IPaymentService,
    @inject(TYPES.IStudentService) private studentService: IStudentService,
    @inject(TYPES.ISubscriptionService) private subscriptionService: ISubscriptionService
  ) {}

  createIntent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { amount: providedAmount } = req.body;
      const amount = Math.round(providedAmount * 100);

      if (!amount || amount <= 0) {
        res.status(400).json({ message: 'Invalid amount' });
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

      const paymentIntent = await this.paymentService.verifyPaymentIntent(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        const paymentRecord = await this.paymentService.savePaymentRecord({
          studentId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: 'completed',
          method: 'stripe',
          type: 'SUBSCRIPTION',
          stripePaymentIntentId: paymentIntentId,
          stripeSessionId: paymentIntent.id,
          invoiceId: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          purpose: `Subscription: ${rawPlanType}`,
        });

        await this.subscriptionService.activateSubscription(
          studentId,
          rawPlanType,
          subjectCount,
          paymentIntentId,
          paymentIntent.id,
          paymentRecord._id.toString()
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

  getAllPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { payments, total } = await this.paymentService.getAllPayments(page, limit, skip);
      res.status(200).json(formatPaginatedResult(payments, total, { page, limit }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ success: false, message });
    }
  };

  getStudentPayments = async (req: Request, res: Response): Promise<void> => {
      try {
          const { studentId } = req.params;
          if (!studentId) {
            res.status(400).json({ message: 'Student ID is required' });
            return;
          }
          const payments = await this.paymentService.getStudentPayments(studentId);
          res.status(200).json({ success: true, data: payments });
      } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Unknown error";
          res.status(500).json({ message });
      }
  };
}
