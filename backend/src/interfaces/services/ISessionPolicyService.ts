export interface ISessionPolicyService {
    /**
     * Checks if a student can request leave (cancellation/rescheduling) for a specific session.
     * @param sessionStartTime The start time of the session
     * @param currentTime Current timestamp
     * @returns boolean indicating if leave is allowed
     */
    canRequestLeave(sessionStartTime: Date, currentTime: Date): boolean;

    /**
     * Checks if a student can request a slot change for a specific session.
     * @param sessionStartTime The start time of the session
     * @param currentTime Current timestamp
     * @returns boolean indicating if slot change is allowed
     */
    canRequestSlotChange(sessionStartTime: Date, currentTime: Date): boolean;
}
