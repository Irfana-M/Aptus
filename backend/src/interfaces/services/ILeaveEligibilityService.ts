import type { ISession } from "../models/session.interface.js";

export interface SessionEligibility {
    id: string;
    session: ISession;
    canRequestLeave: boolean;
    canRequestSlotChange: boolean;
}

export interface LeaveEligibilityResponse {
    sessions: SessionEligibility[];
    leaveWindowOpen: boolean;
    slotChangeWindowOpen: boolean;
}

export interface ILeaveEligibilityService {
    /**
     * Computes eligibility flags for a list of sessions.
     * @param sessions List of sessions to evaluate
     * @param currentTime Current timestamp
     * @returns LeaveEligibilityResponse containing flags for each session and global window status
     */
    computeStudentEligibility(sessions: ISession[], currentTime: Date): LeaveEligibilityResponse;
}
