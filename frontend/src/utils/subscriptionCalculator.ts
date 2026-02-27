/**
 * Frontend helper for subscription cost calculation
 * This mirrors the backend calculation logic
 */

export interface SubscriptionPlan {
  _id: string;
  planCode: string;
  name: string;
  maxSubjects: number;
  sessionsPerSubjectPerWeek: number;
  totalSessionsPerWeek: number;
  sessionType: 'GROUP' | 'ONE_TO_ONE';
  attendanceRequired: boolean;
  rescheduleAllowed: boolean;
  mentorChoice: boolean;
  hasStudyMaterials: boolean;
  hasExams: boolean;
  allowedDays: string[];
  pricePerSession: number;
  currency: string;
  isActive: boolean;
}

export interface CostCalculation {
  planCode: string;
  planName: string;
  numberOfSubjects: number;
  pricePerSession: number;
  sessionsPerWeek: number;
  sessionsPerMonth: number;
  monthlyCost: number;
  currency: string;
}

/**
 * Calculate monthly subscription cost (Frontend Preview)
 * Formula: numberOfSubjects × sessionsPerSubjectPerWeek × pricePerSession × 4 weeks
 */
export const calculateMonthlyCost = (
  plan: SubscriptionPlan,
  numberOfSubjects: number
): CostCalculation => {
  // Validation
  if (numberOfSubjects > plan.maxSubjects) {
    throw new Error(
      `Cannot select ${numberOfSubjects} subjects. Maximum allowed for ${plan.name} is ${plan.maxSubjects}`
    );
  }

  if (numberOfSubjects < 1) {
    throw new Error('Number of subjects must be at least 1');
  }

  // Calculate
  const sessionsPerWeek = numberOfSubjects * plan.sessionsPerSubjectPerWeek;
  const sessionsPerMonth = sessionsPerWeek * 4; // 4 weeks per month
  const monthlyCost = sessionsPerMonth * plan.pricePerSession;

  return {
    planCode: plan.planCode,
    planName: plan.name,
    numberOfSubjects,
    pricePerSession: plan.pricePerSession,
    sessionsPerWeek,
    sessionsPerMonth,
    monthlyCost,
    currency: plan.currency
  };
};

/**
 * Validate if number of subjects is within plan limits
 */
export const validateSubjectCount = (
  plan: SubscriptionPlan,
  numberOfSubjects: number
): { valid: boolean; error?: string } => {
  if (numberOfSubjects < 1) {
    return { valid: false, error: 'Please select at least 1 subject' };
  }

  if (numberOfSubjects > plan.maxSubjects) {
    return {
      valid: false,
      error: `${plan.name} allows maximum ${plan.maxSubjects} subject${plan.maxSubjects > 1 ? 's' : ''}`
    };
  }

  return { valid: true };
};
