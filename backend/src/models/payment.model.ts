import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  studentId: mongoose.Schema.Types.ObjectId;
  amount: number; // Stored in smallest currency unit (e.g., paise for INR)
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'stripe' | 'wallet' | 'other';
  transactionId?: string; // Stripe PaymentIntent ID
  invoiceId: string; // Internal Invoice ID (e.g., INV-1700000001)
  purpose: string; // e.g., 'Subscription', 'Course Purchase'
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'inr' },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded'], 
      default: 'pending' 
    },
    method: { type: String, enum: ['stripe', 'wallet', 'other'], required: true },
    transactionId: { type: String },
    invoiceId: { type: String, required: true, unique: true },
    purpose: { type: String, required: true },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const PaymentModel = mongoose.model<IPayment>('Payment', paymentSchema);
