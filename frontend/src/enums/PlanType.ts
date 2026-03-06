export const PlanType = {
  BASIC : 'basic',
  PREMIUM : 'premium',
} as const;
export type PlanType =
  (typeof PlanType)[keyof typeof PlanType];
