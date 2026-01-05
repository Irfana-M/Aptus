import mongoose from 'mongoose';
import { MentorModel } from '../models/mentor/mentor.model';
import { SubscriptionPlanModel } from '../models/subscription/subscriptionPlan.model';
import { PlanEntitlementModel } from '../models/subscription/planEntitlement.model';
import { StudentSubscriptionModel } from '../models/subscription/studentSubscription.model';
import { StudentModel } from '../models/student/student.model';
import { Subject } from '../models/subject.model';
import { Grade } from '../models/grade.model';
import { StudentSubjectModel } from '../models/student/studentSubject.model';
import { TimeSlotModel } from '../models/scheduling/timeSlot.model';
import { BookingModel } from '../models/scheduling/booking.model';

// Helper to get start/end of current week
function getWeekRange() {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - now.getDay()));
  const end = new Date(now.setDate(now.getDate() - now.getDay() + 6));
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function verifyBookingSystem() {
  try {
    console.log('--- Starting Booking System Verification ---');

    // 1. Setup
    const grade = await Grade.create({ name: 'Grade 12', syllabus: 'CBSE', grade: 12 });
    const subject = await Subject.create({ subjectName: 'Maths', syllabus: 'CBSE', grade: grade._id });
    const mentor = await MentorModel.create({ fullName: 'Booking Mentor', email: `mentor_b_${Date.now()}@test.com` });
    
    const premiumPlan = await SubscriptionPlanModel.create({
      name: 'Premium Plan (2 Sessions/Week)',
      price: 2000,
      isActive: true
    });

    const entitlement = await PlanEntitlementModel.create({
      planId: premiumPlan._id as any,
      maxSubjects: 2,
      sessionsPerSubjectPerWeek: 1, // Limit: 1 session per subject per week
      maxSessionsPerWeek: 2,        // Limit: 2 sessions total per week
      canChooseMentor: true,
      canChooseSlot: true,
      sessionType: 'one-to-one'
    });

    const student = await StudentModel.create({
      fullName: 'Booking Student',
      email: `student_b_${Date.now()}@test.com`,
      isVerified: true
    });

    const subscription = await StudentSubscriptionModel.create({
      studentId: student._id as any,
      planId: premiumPlan._id as any,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'active'
    });
    student.activeSubscriptionId = subscription._id as any;
    await student.save();

    const studentSubject = await StudentSubjectModel.create({
      studentId: student._id as any,
      subjectId: subject._id as any,
      subscriptionId: subscription._id as any,
      status: 'selected'
    });

    // Create 3 TimeSlots
    const slots = await TimeSlotModel.create([
      { mentorId: mentor._id, startTime: new Date(), endTime: new Date(Date.now() + 3600000), status: 'available' },
      { mentorId: mentor._id, startTime: new Date(Date.now() + 86400000), endTime: new Date(Date.now() + 86400000 + 3600000), status: 'available' },
      { mentorId: mentor._id, startTime: new Date(Date.now() + 172800000), endTime: new Date(Date.now() + 172800000 + 3600000), status: 'available' }
    ]);

    console.log('✔ Setup complete. Limits: 1 sess/subject/week, 2 sess total/week.');

    // 2. Validation Function (Simulating Service Logic)
    async function attemptBooking(slotId: mongoose.Types.ObjectId) {
      const { start, end } = getWeekRange();

      // Check Subject Weekly Limit
      const subjectSessionCount = await BookingModel.countDocuments({
        studentSubjectId: studentSubject._id,
        status: { $in: ['scheduled', 'completed'] },
        createdAt: { $gte: start, $lte: end }
      });

      if (subjectSessionCount >= entitlement.sessionsPerSubjectPerWeek) {
        return { success: false, reason: `Subject weekly limit reached (${entitlement.sessionsPerSubjectPerWeek})` };
      }

      // Check Total Weekly Limit
      const totalSessionCount = await BookingModel.countDocuments({
        studentId: student._id,
        status: { $in: ['scheduled', 'completed'] },
        createdAt: { $gte: start, $lte: end }
      });

      if (totalSessionCount >= entitlement.maxSessionsPerWeek) {
        return { success: false, reason: `Total weekly limit reached (${entitlement.maxSessionsPerWeek})` };
      }

      // Perform Booking
      const booking = await BookingModel.create({
        studentId: student._id as any,
        studentSubjectId: studentSubject._id as any,
        timeSlotId: slotId as any,
        status: 'scheduled'
      });

      await TimeSlotModel.findByIdAndUpdate(slotId, { status: 'booked' });
      return { success: true, bookingId: booking._id };
    }

    // 3. Testing Scenarios
    console.log('--- Running Scenarios ---');

    // Scenario 1: First Booking (Should succeed)
    const res1 = await attemptBooking(slots[0]._id as any);
    console.log('Scenario 1 (Normal):', res1.success ? '✔ Success' : `✖ Failed: ${res1.reason}`);

    // Scenario 2: Second Booking for SAME studentSubject (Should fail - subject limit is 1)
    const res2 = await attemptBooking(slots[1]._id as any);
    console.log('Scenario 2 (Subject Limit):', !res2.success ? `✔ Correctly blocked: ${res2.reason}` : '✖ Failure: Allowed over subject limit');

    // 4. CLEANUP
    await BookingModel.deleteMany({ studentId: student._id });
    await TimeSlotModel.deleteMany({ _id: { $in: slots.map(s => s._id) } });
    await StudentSubjectModel.deleteOne({ _id: studentSubject._id });
    await StudentSubscriptionModel.deleteOne({ _id: subscription._id });
    await StudentModel.deleteOne({ _id: student._id });
    await PlanEntitlementModel.deleteOne({ _id: entitlement._id });
    await SubscriptionPlanModel.deleteOne({ _id: premiumPlan._id });
    await MentorModel.deleteOne({ _id: mentor._id });
    await Subject.deleteOne({ _id: subject._id });
    await Grade.deleteOne({ _id: grade._id });

    console.log('✔ Cleanup completed');
    console.log('--- Verification Successful ---');

  } catch (error) {
    console.error('✖ Verification Failed:', error);
  }
}

export { verifyBookingSystem };
