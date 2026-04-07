import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SubscriptionPlanModel } from '../models/subscription/subscriptionPlan.model';

dotenv.config();

const PLANS = [
  {
    planCode: "BASIC",
    name: "Basic Group Plan",
    maxSubjects: 3,
    sessionsPerSubjectPerWeek: 1,
    totalSessionsPerWeek: 3,
    sessionType: "GROUP",
    attendanceRequired: false,
    rescheduleAllowed: false,
    mentorChoice: false,
    hasStudyMaterials: true,
    hasExams: false,
    allowedDays: ["Saturday", "Sunday"], // BASIC: Weekends only (GROUP sessions)
    pricePerSession: 200,
    currency: "INR"
  },
  {
    planCode: "PREMIUM",
    name: "Premium 1-1 Plan",
    maxSubjects: 7,
    sessionsPerSubjectPerWeek: 2,
    totalSessionsPerWeek: 14,
    sessionType: "ONE_TO_ONE",
    attendanceRequired: true,
    rescheduleAllowed: true,
    mentorChoice: true,
    hasStudyMaterials: true,
    hasExams: true,
    allowedDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], // PREMIUM: All days (1-to-1 sessions)
    pricePerSession: 600,
    currency: "INR"
  }
];

const seedPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log('Connected to MongoDB');

    await SubscriptionPlanModel.deleteMany({});
    console.log('Cleared existing plans');

    await SubscriptionPlanModel.insertMany(PLANS);
    console.log('Seeded new plans');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding plans:', error);
    process.exit(1);
  }
};

seedPlans();
