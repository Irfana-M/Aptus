import Stripe from "stripe";

export interface IPaymentService {
  createPaymentIntent(amount: number, currency?: string): Promise<Stripe.PaymentIntent>;
  verifyPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  savePaymentRecord(data: Record<string, unknown>): Promise<unknown>;
}
