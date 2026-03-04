import { PlanType } from '../enums/PlanType';

export const PLAN_LIMITS = {
  [PlanType.BASIC]: {
    sessionsPerMonth: 4,
    maxGroupSize: 10,
  },
  [PlanType.PREMIUM]: {
    sessionsPerMonth: 8,
    maxGroupSize: 1, // one-to-one
  },
};

export const PRICING_STRUCTURE = {
  [PlanType.BASIC]: {
    monthly: 2999,
    currency: 'INR',
  },
  [PlanType.PREMIUM]: {
    monthly: 9999, // Assumption
    currency: 'INR',
  },
};
