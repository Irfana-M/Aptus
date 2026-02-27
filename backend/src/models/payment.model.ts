import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Schema.Types.ObjectId;
  amount: number; 
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'stripe' | 'other';
  type: 'SUBSCRIPTION' | 'ONE_TIME';
  transactionId?: string; 
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  invoiceId: string; 
  purpose: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'inr' },
    status: { 
      type: String, 
      enum: ['pending', 'completed', 'failed', 'refunded'], 
      default: 'pending',
      index: true
    },
    method: { type: String, enum: ['stripe', 'other'], required: true },
    type: { 
      type: String, 
      enum: ['SUBSCRIPTION', 'ONE_TIME'], 
      default: 'SUBSCRIPTION',
      index: true
    },
    transactionId: { type: String },
    stripePaymentIntentId: { type: String },
    stripeSessionId: { type: String },
    invoiceId: { type: String, required: true, unique: true },
    purpose: { type: String, required: true },
    metadata: { type: Map, of: Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentSchema.index({ createdAt: 1 });

export const PaymentModel = mongoose.model<IPayment>('Payment', paymentSchema);
