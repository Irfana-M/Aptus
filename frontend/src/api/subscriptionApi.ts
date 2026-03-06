import api from './api';
import type { ApiResponse } from '../types/api.types';
import type { SubscriptionPlan, CostCalculation } from '../utils/subscriptionCalculator';

/**
 * Fetch all active subscription plans
 */
export const getActivePlans = async (): Promise<ApiResponse<SubscriptionPlan[]>> => {
  const response = await api.get<ApiResponse<SubscriptionPlan[]>>(`/subscription/plans`);
  return response.data;
};

/**
 * Calculate monthly subscription cost (Backend validation)
 */
export const calculateCost = async (
  planCode: string,
  numberOfSubjects: number
): Promise<ApiResponse<CostCalculation>> => {
  const response = await api.post<ApiResponse<CostCalculation>>(`/subscription/calculate-cost`, {
    planCode,
    numberOfSubjects
  });
  return response.data;
};
