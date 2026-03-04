import type { IPayment } from "../../models/payment.model.js";

export interface IPaymentRepository {
  create(data: Partial<IPayment>): Promise<IPayment>;
  findById(id: string): Promise<IPayment | null>;
  findAll(skip: number, limit: number): Promise<IPayment[]>;
  countDocuments(): Promise<number>;
  findByStudentId(studentId: string): Promise<IPayment[]>;
  getTotalRevenue(): Promise<number>;
  getMonthlyRevenue(): Promise<{ month: string; amount: number }[]>;
  getRevenuePerStudent(): Promise<{ studentId: string; studentName: string; amount: number }[]>;
  findLatestSubscriptionPayment(studentId: string): Promise<IPayment | null>;
}
