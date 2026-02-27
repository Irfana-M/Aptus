import Stripe from "stripe";

export interface IPaymentService {
  createPaymentIntent(amount: number, currency?: string): Promise<Stripe.PaymentIntent>;
  verifyPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  savePaymentRecord(data: Record<string, unknown>): Promise<any>;
  getAllPayments(page: number, limit: number, skip: number): Promise<{ payments: any[]; total: number }>;
  getStudentPayments(studentId: string): Promise<any[]>;
}
