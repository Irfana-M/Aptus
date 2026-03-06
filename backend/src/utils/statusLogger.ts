import { logger } from "./logger.js";

export class StatusLogger {
  static logLeaveStatusChange(mentorId: string, leaveId: string, oldStatus: string, newStatus: string, actorId: string) {
    logger.info(`STATUS_CHANGE: Leave ${leaveId} for mentor ${mentorId} changed from ${oldStatus} to ${newStatus} by ${actorId}`);
  }

  static logPolicyViolation(mentorId: string, policy: string, details: string) {
    logger.warn(`POLICY_VIOLATION: Mentor ${mentorId} violated ${policy}. Details: ${details}`);
  }

  static logSessionImpact(sessionId: string, impact: string) {
    logger.info(`SESSION_IMPACT: Session ${sessionId} impacted: ${impact}`);
  }

  static logUserAction(userId: string, action: string, details: string) {
    logger.info(`USER_ACTION: User ${userId} performed ${action}. Details: ${details}`);
  }
}
