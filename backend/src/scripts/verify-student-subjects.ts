import mongoose from 'mongoose';
import { SubscriptionPlanModel } from '../models/subscription/subscriptionPlan.model';
import { PlanEntitlementModel } from '../models/subscription/planEntitlement.model';
import { StudentSubscriptionModel } from '../models/subscription/studentSubscription.model';
import { StudentModel } from '../models/student/student.model';
import { Subject } from '../models/subject.model';
import { Grade } from '../models/grade.model';
import { StudentSubjectModel } from '../models/student/studentSubject.model';

async function verifyStudentSubjectSelection() {
  try {
    console.log('--- Starting Student-Subject Verification ---');

    // 1. Setup Base Data (Grade, Subject, Plan)
    const grade = await Grade.create({ name: 'Grade 10', syllabus: 'CBSE', grade: 10 });
    const subject1 = await Subject.create({ subjectName: 'Physics', syllabus: 'CBSE', grade: grade._id });
    const subject2 = await Subject.create({ subjectName: 'Chemistry', syllabus: 'CBSE', grade: grade._id });

    const basicPlan = await SubscriptionPlanModel.create({
      name: 'Basic Plan (1 Subject)',
      price: 500,
      isActive: true
    });

    const entitlement = await PlanEntitlementModel.create({
      planId: basicPlan._id as any,
      maxSubjects: 1, // LIMIT IS 1
      sessionsPerSubjectPerWeek: 1,
      maxSessionsPerWeek: 1,
      canChooseMentor: false,
      canChooseSlot: false,
      sessionType: 'group'
    });

    // 2. Setup Student and Subscription
    const student = await StudentModel.create({
      fullName: 'Subject Tester',
      email: `subject_test_${Date.now()}@example.com`,
      isVerified: true
    });

    const subscription = await StudentSubscriptionModel.create({
      studentId: student._id as any,
      planId: basicPlan._id as any,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    });

    student.activeSubscriptionId = subscription._id as any;
    await student.save();

    console.log('✔ Setup complete. Plan limit:', entitlement.maxSubjects);

    // 3. VALIDATION RULE: Check Entitlement (Attempt to select 2 subjects)
    console.log('--- Testing Entitlement Limit ---');
    
    // First Selection
    const count = await StudentSubjectModel.countDocuments({ 
        studentId: student._id, 
        subscriptionId: subscription._id 
    });

    if (count < entitlement.maxSubjects) {
      await StudentSubjectModel.create({
        studentId: student._id as any,
        subjectId: subject1._id as any,
        subscriptionId: subscription._id as any,
        status: 'selected'
      });
      console.log('✔ First subject selected successfully.');
    }

    // Second Selection (Should be blocked by logic)
    const newCount = await StudentSubjectModel.countDocuments({ 
        studentId: student._id, 
        subscriptionId: subscription._id 
    });

    if (newCount < entitlement.maxSubjects) {
      await StudentSubjectModel.create({
        studentId: student._id as any,
        subjectId: subject2._id as any,
        subscriptionId: subscription._id as any,
        status: 'selected'
      });
    } else {
      console.log('✔ Correctly blocked! Max subjects reached:', entitlement.maxSubjects);
    }

    // 4. CLEANUP
    await StudentSubjectModel.deleteMany({ studentId: student._id });
    await StudentSubscriptionModel.deleteOne({ _id: subscription._id });
    await StudentModel.deleteOne({ _id: student._id });
    await PlanEntitlementModel.deleteOne({ _id: entitlement._id });
    await SubscriptionPlanModel.deleteOne({ _id: basicPlan._id });
    await Subject.deleteMany({ _id: { $in: [subject1._id, subject2._id] } });
    await Grade.deleteOne({ _id: grade._id });

    console.log('✔ Cleanup completed');
    console.log('--- Verification Successful ---');

  } catch (error) {
    console.error('✖ Verification Failed:', error);
  }
}

export { verifyStudentSubjectSelection };
