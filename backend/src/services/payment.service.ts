import Stripe from 'stripe';
import { injectable } from 'inversify';
import type { IPaymentService } from '../interfaces/services/payment.service.interface';

@injectable()
export class PaymentService implements IPaymentService {
  private stripe: Stripe;

  constructor() {
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

  async savePaymentRecord(data: Record<string, unknown>): Promise<unknown> {
    const { PaymentModel } = await import('../models/payment.model'); 
    
    return await PaymentModel.create(data);
  }
}
