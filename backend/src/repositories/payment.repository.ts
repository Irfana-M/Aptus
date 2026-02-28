import { injectable } from "inversify";
import { PaymentModel, type IPayment } from "../models/payment.model";
import type { IPaymentRepository } from "../interfaces/repositories/IPaymentRepository";

@injectable()
export class PaymentRepository implements IPaymentRepository {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return await PaymentModel.create(data);
  }

  async findById(id: string): Promise<IPayment | null> {
    return await PaymentModel.findById(id).populate('studentId', 'fullName email').lean().exec() as unknown as IPayment | null;
  }

  async findAll(skip: number, limit: number): Promise<IPayment[]> {
    return await PaymentModel.find()
      .populate('studentId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
      .exec() as unknown as IPayment[];
  }

  async countDocuments(): Promise<number> {
    return await PaymentModel.countDocuments();
  }

  async findByStudentId(studentId: string): Promise<IPayment[]> {
    return await PaymentModel.find({ studentId })
      .sort({ createdAt: -1 })
      .lean()
      .exec() as unknown as IPayment[];
  }

  async getTotalRevenue(): Promise<number> {
    const res = await PaymentModel.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return res[0]?.total || 0;
  }

  async getMonthlyRevenue(): Promise<{ month: string; amount: number }[]> {
    const res = await PaymentModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);
    return res.map(r => ({
      month: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
      amount: r.amount
    }));
  }

  async getRevenuePerStudent(): Promise<{ studentId: string; studentName: string; amount: number }[]> {
    const res = await PaymentModel.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$studentId',
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { amount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $project: {
          studentId: '$_id',
          studentName: { $arrayElemAt: ['$student.fullName', 0] },
          amount: 1
        }
      }
    ]);
    return res as any;
  }
}
