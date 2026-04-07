import type { IPayment } from "../../models/payment.model";
import Stripe from "stripe";

export interface IPaymentService {
  createPaymentIntent(amount: number, currency?: string): Promise<Stripe.PaymentIntent>;
  verifyPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent>;
  savePaymentRecord(data: Partial<IPayment>): Promise<IPayment>;
  getAllPayments(page: number, limit: number, skip: number): Promise<{ payments: IPayment[]; total: number }>;
  getStudentPayments(studentId: string): Promise<IPayment[]>;
  findLatestSubscriptionPayment(studentId: string): Promise<IPayment | null>;
}
