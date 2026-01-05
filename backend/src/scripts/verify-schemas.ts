// import mongoose from 'mongoose';
import { SubscriptionPlanModel } from '../models/subscription/subscriptionPlan.model';
import { PlanEntitlementModel } from '../models/subscription/planEntitlement.model';
import { StudentSubscriptionModel } from '../models/subscription/studentSubscription.model';
import { StudentModel } from '../models/student/student.model';

async function verifySchemas() {
  try {
    console.log('--- Starting Schema Verification ---');
    
    // 1. Create a Subscription Plan
    const basicPlan = await SubscriptionPlanModel.create({
      name: 'Basic Test Plan',
      price: 999,
      isActive: true
    });
    console.log('✔ SubscriptionPlan created:', basicPlan.name);

    // 2. Create Plan Entitlements
    const basicEntitlement = await PlanEntitlementModel.create({
      planId: basicPlan._id,
      maxSubjects: 1,
      sessionsPerSubjectPerWeek: 1,
      maxSessionsPerWeek: 1,
      canChooseMentor: false,
      canChooseSlot: false,
      sessionType: 'group'
    });
    console.log('✔ PlanEntitlement created for:', basicPlan.name);

    // 3. Create a mock student
    const mockStudent = await StudentModel.create({
      fullName: 'Test Student',
      email: `test_student_${Date.now()}@example.com`,
      isVerified: true
    });
    console.log('✔ Student created:', mockStudent.fullName);

    // 4. Create a Student Subscription
    const studentSub = await StudentSubscriptionModel.create({
      studentId: mockStudent._id,
      planId: basicPlan._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    });
    console.log('✔ StudentSubscription created with status:', studentSub.status);

    // 5. Update Student with active subscription
    mockStudent.activeSubscriptionId = studentSub._id as mongoose.Types.ObjectId;
    await mockStudent.save();
    console.log('✔ Student updated with activeSubscriptionId');

    // 6. Cleanup (Optional but good for repeated tests)
    await StudentSubscriptionModel.deleteOne({ _id: studentSub._id });
    await StudentModel.deleteOne({ _id: mockStudent._id });
    await PlanEntitlementModel.deleteOne({ _id: basicEntitlement._id });
    await SubscriptionPlanModel.deleteOne({ _id: basicPlan._id });
    console.log('✔ Cleanup completed');

    console.log('--- Verification Successful ---');
  } catch (error) {
    console.error('✖ Verification Failed:', error);
  }
}

// Note: This script assumes it's being run in an environment where mongoose is connected.
// For a real run, we might need to wrap it with connection logic or run it via a test runner.
// Given the environment, I'll just check if it compiles and the logic is sound.
export { verifySchemas };
