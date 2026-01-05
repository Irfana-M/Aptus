export interface ISubscriptionService {
  activateSubscription(studentId: string, plan: string, subjectCount: number, paymentIntentId: string, sessionId: string): Promise<any>;
}
