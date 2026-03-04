import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { StudentModel } from '../models/student/student.model.js';
import { PaymentModel } from '../models/payment.model.js';

dotenv.config();

const migratePayments = async () => {
  try {
    console.log('🚀 Starting Payment Migration...');
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('✅ Connected to MongoDB');

    const students = await StudentModel.find({
      $or: [
        { hasPaid: true },
        { 'subscription.paymentIntentId': { $exists: true } },
        { 'subscription.status': 'active' }
      ]
    }).lean();

    console.log(`📊 Found ${students.length} students to check for migration.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const student of students) {
      if (!student.subscription || (!student.subscription.paymentIntentId && !student.hasPaid)) {
        skippedCount++;
        continue;
      }

      // Check if a payment already exists for this transaction
      const transactionId = student.subscription.paymentIntentId || `LEGACY-${student._id}`;
      const existingPayment = await PaymentModel.findOne({
        $or: [
          { stripePaymentIntentId: transactionId },
          { transactionId: transactionId }
        ]
      });

      if (existingPayment) {
        skippedCount++;
        // If the student doesn't have the paymentId ref, add it
        if (!student.subscription.paymentId) {
          await StudentModel.updateOne(
            { _id: student._id },
            { $set: { 'subscription.paymentId': existingPayment._id } }
          );
        }
        continue;
      }

      // Infer amount based on plan if not present
      const planCode = student.subscription.planCode || 'BASIC';
      const subCount = student.subscription.subjectCount || 1;
      let amount = 0;
      
      if (planCode.includes('PREMIUM')) {
        amount = subCount >= 4 ? 20000 : subCount * 5000;
      } else {
        amount = subCount * 500;
      }

      // Create Payment record
      const payment = await PaymentModel.create({
        studentId: student._id,
        amount: amount,
        currency: 'inr',
        status: 'completed',
        method: student.subscription.paymentIntentId?.startsWith('pi_') ? 'stripe' : 'wallet',
        type: 'SUBSCRIPTION',
        stripePaymentIntentId: student.subscription.paymentIntentId?.startsWith('pi_') ? student.subscription.paymentIntentId : undefined,
        transactionId: transactionId,
        invoiceId: `INV-MIG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        purpose: `Migrated Subscription: ${planCode}`,
        metadata: { migrated: true, originalStudentId: student._id },
        createdAt: student.subscription.startDate || student.createdAt || new Date()
      });

      // Update student with reference
      await StudentModel.updateOne(
        { _id: student._id },
        { $set: { 'subscription.paymentId': payment._id } }
      );

      migratedCount++;
      if (migratedCount % 10 === 0) {
        console.log(`Processed ${migratedCount} migrations...`);
      }
    }

    console.log('\n✨ Migration Complete!');
    console.log(`✅ Migrated: ${migratedCount}`);
    console.log(`⏭️ Skipped (already exists): ${skippedCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migratePayments();
