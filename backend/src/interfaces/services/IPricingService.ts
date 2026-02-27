export interface IPricingService {
  calculateSessionCost(studentId: string): Promise<{ cost: number; currency: string }>;
}
