import { injectable, inject } from "inversify";
import { TYPES } from "../../types"
import { ILeaveEligibilityService, LeaveEligibilityResponse, SessionEligibility } from "../../interfaces/services/ILeaveEligibilityService";
import { ISessionPolicyService } from "../../interfaces/services/ISessionPolicyService";
import { ISession } from "../../interfaces/models/session.interface";

@injectable()
export class LeaveEligibilityService implements ILeaveEligibilityService {
    constructor(
        @inject(TYPES.ISessionPolicyService) private _policyService: import("../../interfaces/services/ISessionPolicyService").ISessionPolicyService
    ) {}

    computeStudentEligibility(sessions: ISession[], currentTime: Date): LeaveEligibilityResponse {
        const eligibleSessions: SessionEligibility[] = sessions.map(session => {
            // Cancelled sessions (by anyone) are never eligible for leave or slot change.
            const isCancelled = (session as any).status === 'cancelled';

            return {
                id: (session as any)._id?.toString() || (session as any).id?.toString(),
                session: session,
                canRequestLeave: !isCancelled && this._policyService.canRequestLeave(new Date(session.startTime), currentTime),
                canRequestSlotChange: !isCancelled && this._policyService.canRequestSlotChange(new Date(session.startTime), currentTime)
            };
        });

        const leaveWindowOpen = eligibleSessions.some(s => s.canRequestLeave);
        const slotChangeWindowOpen = eligibleSessions.some(s => s.canRequestSlotChange);

        return {
            sessions: eligibleSessions,
            leaveWindowOpen,
            slotChangeWindowOpen
        };
    }
}
