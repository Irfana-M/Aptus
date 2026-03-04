import type { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types.js';
import type { IPaymentService } from '@/interfaces/services/payment.service.interface.js';
import type { IStudentService } from "@/interfaces/services/IStudentService.js";
import type { ISubscriptionService } from "@/interfaces/services/ISubscriptionService.js";
import { getPaginationParams, formatPaginatedResult } from '@/utils/pagination.util.js';
import { HttpStatusCode } from '@/constants/httpStatus.js';
import { MESSAGES } from '@/constants/messages.constants.js';
import { SubscriptionStatus } from '@/enums/subscription.enum.js';
import { PaymentStatus } from '@/enums/payment.enum.js';

@injectable()
export class PaymentController {
  constructor(
    @inject(TYPES.IPaymentService) private _paymentService: IPaymentService,
    @inject(TYPES.IStudentService) private _studentService: IStudentService,
    @inject(TYPES.ISubscriptionService) private _subscriptionService: ISubscriptionService
  ) {}

createIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount: providedAmount, studentId } = req.body;
    const amount = Math.round(providedAmount * 100);

    if (!amount || amount <= 0) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.PAYMENT.INVALID_AMOUNT });
      return;
    }

    if (studentId) {
      const student = await this._studentService.getById(studentId);

      if (student?.subscription?.status === SubscriptionStatus.ACTIVE) {
        const endDate = new Date(student.subscription.endDate);

        if (endDate > new Date()) {
          res.status(HttpStatusCode.FORBIDDEN).json({
            message: MESSAGES.PAYMENT.ACTIVE_SUBSCRIPTION_EXISTS,
            code: 'ALREADY_SUBSCRIBED'
          });
          return;
        }
      }

      const latestPayment =
        await this._paymentService.findLatestSubscriptionPayment(studentId);

      if (latestPayment) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (new Date(latestPayment.createdAt) > thirtyDaysAgo) {
          res.status(HttpStatusCode.FORBIDDEN).json({
            message: MESSAGES.PAYMENT.DUPLICATE_PAYMENT,
            code: 'MONTHLY_PAYMENT_LIMIT'
          });
          return;
        }
      }
    }

    const paymentIntent =
      await this._paymentService.createPaymentIntent(amount);

    res.status(HttpStatusCode.OK).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });

  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;

    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message });
  }
};

  confirmPayment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paymentIntentId, studentId, planType: rawPlanType, subjectCount = 1 } = req.body;

      if (!studentId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.PAYMENT.STUDENT_ID_REQUIRED });
        return;
      }

      const paymentIntent = await this._paymentService.verifyPaymentIntent(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        const paymentRecord = await this._paymentService.savePaymentRecord({
          studentId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: PaymentStatus.COMPLETED,
          method: 'stripe',
          type: 'SUBSCRIPTION',
          stripePaymentIntentId: paymentIntentId,
          stripeSessionId: paymentIntent.id,
          invoiceId: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          purpose: `Subscription: ${rawPlanType}`,
        });

        await this._subscriptionService.activateSubscription(
          studentId,
          rawPlanType,
          subjectCount,
          paymentIntentId,
          paymentIntent.id,
          paymentRecord._id.toString()
        );

        res.status(HttpStatusCode.OK).json({ success: true, message: MESSAGES.PAYMENT.ACTIVATION_SUCCESS });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ success: false, message: MESSAGES.PAYMENT.PAYMENT_FAILED });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : MESSAGES.COMMON.UNKNOWN_ERROR;
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message });
    }
  };

  getAllPayments = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const { payments, total } = await this._paymentService.getAllPayments(page, limit, skip);
      res.status(HttpStatusCode.OK).json(formatPaginatedResult(payments, total, { page, limit }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ success: false, message });
    }
  };

  getStudentPayments = async (req: Request, res: Response): Promise<void> => {
      try {
          const { studentId } = req.params;
          if (!studentId) {
            res.status(HttpStatusCode.BAD_REQUEST).json({ message: MESSAGES.PAYMENT.STUDENT_ID_REQUIRED });
            return;
          }
          const payments = await this._paymentService.getStudentPayments(studentId);
          res.status(HttpStatusCode.OK).json({ success: true, data: payments });
      } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Unknown error";
          res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ message });
      }
  };
}
