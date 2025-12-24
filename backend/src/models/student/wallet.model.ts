import mongoose, { Schema, Document } from 'mongoose';

export interface IWallet extends Document {
  studentId: mongoose.Schema.Types.ObjectId;
  balance: number;
  currency: string;
}

const walletSchema = new Schema<IWallet>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
  },
  { timestamps: true }
);

export const WalletModel = mongoose.model<IWallet>('Wallet', walletSchema);
