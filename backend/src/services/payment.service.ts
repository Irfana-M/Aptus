import Stripe from 'stripe';
import { injectable, inject } from 'inversify';
import type { IPaymentService } from '../interfaces/services/payment.service.interface';
import { TYPES } from '../types';
import type { IPaymentRepository } from '../interfaces/repositories/IPaymentRepository';

@injectable()
export class PaymentService implements IPaymentService {
  private stripe: Stripe;

  constructor(
    @inject(TYPES.IPaymentRepository) private _paymentRepo: IPaymentRepository
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-12-18.acacia' as any, 
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'inr'): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
    });
  }

  async verifyPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return await this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async savePaymentRecord(data: Record<string, unknown>): Promise<any> {
    return await this._paymentRepo.create(data as any);
  }

  async getAllPayments(page: number, limit: number, skip: number): Promise<{ payments: any[]; total: number }> {
    const [payments, total] = await Promise.all([
      this._paymentRepo.findAll(skip, limit),
      this._paymentRepo.countDocuments()
    ]);
    return { payments, total };
  }

  async getStudentPayments(studentId: string): Promise<any[]> {
    return await this._paymentRepo.findByStudentId(studentId);
  }
}
