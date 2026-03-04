import { injectable, inject } from "inversify";
import { TYPES } from "../../types.js";
import { ILeaveEligibilityService, LeaveEligibilityResponse, SessionEligibility } from "../../interfaces/services/ILeaveEligibilityService.js";
import { ISessionPolicyService } from "../../interfaces/services/ISessionPolicyService.js";
import { ISession } from "../../interfaces/models/session.interface.js";

@injectable()
export class LeaveEligibilityService implements ILeaveEligibilityService {
    constructor(
        @inject(TYPES.ISessionPolicyService) private _policyService: import("../../interfaces/services/ISessionPolicyService.js").ISessionPolicyService
    ) {}

    computeStudentEligibility(sessions: ISession[], currentTime: Date): LeaveEligibilityResponse {
        const eligibleSessions: SessionEligibility[] = sessions.map(session => ({
            id: (session as any)._id?.toString() || (session as any).id?.toString(),
            session: session,
            canRequestLeave: this._policyService.canRequestLeave(new Date(session.startTime), currentTime),
            canRequestSlotChange: this._policyService.canRequestSlotChange(new Date(session.startTime), currentTime)
        }));

        const leaveWindowOpen = eligibleSessions.some(s => s.canRequestLeave);
        const slotChangeWindowOpen = eligibleSessions.some(s => s.canRequestSlotChange);

        return {
            sessions: eligibleSessions,
            leaveWindowOpen,
            slotChangeWindowOpen
        };
    }
}
