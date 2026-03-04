import { injectable } from "inversify";
import { ISessionPolicyService } from "../../interfaces/services/ISessionPolicyService.js";
import { STUDENT_CANCEL_CUTOFF_HOURS } from "../../config/leavePolicy.config.js";

@injectable()
export class SessionPolicyService implements ISessionPolicyService {
    canRequestLeave(sessionStartTime: Date, currentTime: Date): boolean {
        const diffInHours = (sessionStartTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
        return diffInHours >= STUDENT_CANCEL_CUTOFF_HOURS;
    }

    canRequestSlotChange(sessionStartTime: Date, currentTime: Date): boolean {
        // Following the same 24-hour policy as requested
        const diffInHours = (sessionStartTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
        return diffInHours >= STUDENT_CANCEL_CUTOFF_HOURS;
    }
}
