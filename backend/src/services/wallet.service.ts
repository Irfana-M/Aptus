import { injectable } from 'inversify';
import mongoose from 'mongoose';
import { WalletModel } from '../models/student/wallet.model';
import { WalletTransactionModel } from '../models/student/walletTransaction.model';

import type { IWalletService } from '../interfaces/services/IWalletService';

@injectable()
export class WalletService implements IWalletService {
  
  async createWallet(studentId: string): Promise<void> {
    // Check if wallet already exists
    const existingWallet = await WalletModel.findOne({ studentId });
    if (existingWallet) return;

    await WalletModel.create({ studentId, balance: 0 });
  }

  async getWallet(studentId: string) {
    let wallet = await WalletModel.findOne({ studentId });
    if (!wallet) {
      // Lazy creation if it doesn't exist
      wallet = await WalletModel.create({ studentId, balance: 0 });
    }
    return wallet;
  }

  async getBalance(studentId: string): Promise<number> {
    const wallet = await this.getWallet(studentId);
    return wallet.balance;
  }

  async getTransactions(studentId: string) {
    const wallet = await this.getWallet(studentId);
    return await WalletTransactionModel.find({ walletId: wallet._id }).sort({ createdAt: -1 });
  }

  async creditWallet(studentId: string, amount: number, source: 'REFERRAL' | 'REWARD' | 'REFUND', description: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await WalletModel.findOne({ studentId }).session(session);
      if (!wallet) throw new Error('Wallet not found');

      wallet.balance += amount;
      await wallet.save({ session });

      await WalletTransactionModel.create([{
        walletId: wallet._id,
        amount,
        type: 'CREDIT',
        source,
        description
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Used for subscriptions or other payments
  async debitWallet(studentId: string, amount: number, source: 'PURCHASE', description: string): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const wallet = await WalletModel.findOne({ studentId }).session(session);
      if (!wallet) throw new Error('Wallet not found');

      if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      wallet.balance -= amount;
      await wallet.save({ session });

      await WalletTransactionModel.create([{
        walletId: wallet._id,
        amount,
        type: 'DEBIT',
        source,
        description
      }], { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
