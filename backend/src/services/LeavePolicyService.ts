import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { ILeavePolicyService } from "../interfaces/services/ILeavePolicyService";
import { MENTOR_LEAVE_CUTOFF_HOURS } from "../config/leavePolicy.config";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { MESSAGES } from "../constants/messages.constants";
import type { ISessionRepository } from "../interfaces/repositories/ISessionRepository";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import { LEAVE_STATUS } from "../constants/status.constants";
import { StatusLogger } from "../utils/statusLogger";

@injectable()
export class LeavePolicyService implements ILeavePolicyService {
    constructor(
        @inject(TYPES.ISessionRepository) private _sessionRepo: ISessionRepository,
        @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository
    ) {}

    async validateLeaveRequest(mentorId: string, startDate: Date, endDate: Date): Promise<void> {
        // 1. Check for overlapping PENDING/APPROVED leaves (Idempotency)
        const mentor = await this._mentorRepo.findById(mentorId);
        if (!mentor) throw new AppError(MESSAGES.MENTOR.NOT_FOUND, HttpStatusCode.NOT_FOUND);

        const hasOverlap = mentor.leaves?.some(leave => 
            leave.status !== LEAVE_STATUS.REJECTED && 
            leave.status !== LEAVE_STATUS.CANCELLED &&
            ((startDate >= leave.startDate && startDate <= leave.endDate) ||
             (endDate >= leave.startDate && endDate <= leave.endDate))
        );

        if (hasOverlap) {
            StatusLogger.logPolicyViolation(mentorId, "Leave Overlap", "A leave request already exists for this period");
            throw new AppError("A leave request already exists for this period", HttpStatusCode.CONFLICT);
        }

        // 2. Check 24-hour cutoff policy
        const upcomingSessions = await this._sessionRepo.findUpcomingByMentor(mentorId);
        const now = new Date();

        for (const session of upcomingSessions) {
            const sessionStart = new Date(session.startTime);
            // If session falls within leave range
            if (sessionStart >= startDate && sessionStart <= endDate) {
                if (!this.isWithinCutoff(sessionStart)) {
                    StatusLogger.logPolicyViolation(mentorId, "24-Hour Cutoff", `Session at ${sessionStart} violates policy`);
                    throw new AppError(
                        MESSAGES.MENTOR.LEAVE_CUTOFF_VIOLATION, 
                        HttpStatusCode.FORBIDDEN
                    );
                }
            }
        }
    }

    isWithinCutoff(sessionStartTime: Date): boolean {
        const now = new Date();
        const diffInHours = (sessionStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffInHours >= MENTOR_LEAVE_CUTOFF_HOURS;
    }
}
