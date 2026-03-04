import { SCHEDULING_CONFIG } from "../../constants/schedulingDecision.js";

export interface CancellationResult {
  shouldRefundSession: boolean;
  status: 'cancelled' | 'forfeited';
  reason?: string;
}

export class ReschedulePolicy {
  
  public static handleCancellation(startTime: Date): CancellationResult {
    const now = new Date();
    const diffHours = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < SCHEDULING_CONFIG.MIN_CANCELLATION_HOURS) {
      return {
        shouldRefundSession: false,
        status: 'forfeited',
        reason: "Late cancellation: Session usage is consumed."
      };
    }

    return {
      shouldRefundSession: true,
      status: 'cancelled'
    };
  }

  
  public static handleAbsence(): CancellationResult {
    return {
      shouldRefundSession: false,
      status: 'forfeited' 
    };
  }
}
