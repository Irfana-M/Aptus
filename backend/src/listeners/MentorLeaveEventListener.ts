import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import { InternalEventEmitter } from "../utils/InternalEventEmitter";
import { DomainEvent } from "../constants/events";
import type { ILeaveManagementService } from "../interfaces/services/ILeaveManagementService";
import type { INotificationService } from "../interfaces/services/INotificationService";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";

@injectable()
export class MentorLeaveEventListener {
    constructor(
        @inject(TYPES.InternalEventEmitter) private _eventEmitter: InternalEventEmitter,
        @inject(TYPES.ILeaveManagementService) private _leaveManagementService: ILeaveManagementService,
        @inject(TYPES.INotificationService) private _notificationService: INotificationService
    ) {}

    public initialize(): void {
        logger.info("Initializing Mentor Leave Event Listener...");

        this._eventEmitter.on(DomainEvent.MENTOR_LEAVE_APPROVED, async (data: { mentorId: string; leaveId: string; startDate: Date; endDate: Date }) => {
            try {
                logger.info(`Received MENTOR_LEAVE_APPROVED for mentor ${data.mentorId}, leave ${data.leaveId}`);
                await this._leaveManagementService.processLeaveImpact(data.mentorId, data.startDate, data.endDate);
                logger.info(`Successfully processed leave impact for mentor ${data.mentorId}`);
            } catch (error) {
                logger.error(`Error in MentorLeaveEventListener for MENTOR_LEAVE_APPROVED: ${getErrorMessage(error)}`);
            }
        });

        this._eventEmitter.on(DomainEvent.MENTOR_LEAVE_REJECTED, async (data: { mentorId: string; leaveId: string; reason: string }) => {
            try {
                logger.info(`Received MENTOR_LEAVE_REJECTED for mentor ${data.mentorId}, leave ${data.leaveId}`);
                
                await this._notificationService.notifyUser(
                    data.mentorId,
                    'mentor',
                    'session_cancelled', // or a more specific template if available
                    { 
                        message: `Your leave request has been rejected. Reason: ${data.reason}`,
                        reason: data.reason
                    }
                );

                logger.info(`Successfully notified mentor ${data.mentorId} about leave rejection`);
            } catch (error) {
                logger.error(`Error in MentorLeaveEventListener for MENTOR_LEAVE_REJECTED: ${getErrorMessage(error)}`);
            }
        });
    }
}
