import mongoose, { Schema, Document } from 'mongoose';

export interface IWalletTransaction extends Document {
  walletId: mongoose.Schema.Types.ObjectId;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  source: 'REFERRAL' | 'REWARD' | 'PURCHASE' | 'REFUND';
  description?: string;
}

const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
    source: { type: String, enum: ['REFERRAL', 'REWARD', 'PURCHASE', 'REFUND'], required: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const WalletTransactionModel = mongoose.model<IWalletTransaction>('WalletTransaction', walletTransactionSchema);
