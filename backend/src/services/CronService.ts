import nodeCron from 'node-cron';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { INotificationService } from '../interfaces/services/INotificationService';
import type { ISchedulingService } from '../interfaces/services/ISchedulingService';
import type { ISessionService } from '../interfaces/services/ISessionService';
import type { IStudyMaterialService } from '../interfaces/services/IStudyMaterialService';
import { logger } from '../utils/logger';

@injectable()
export class CronService {
  constructor(
    @inject(TYPES.INotificationService) private _notificationService: INotificationService,
    @inject(TYPES.ISchedulingService) private _schedulingService: ISchedulingService,
    @inject(TYPES.ISessionService) private _sessionService: ISessionService,
    @inject(TYPES.IStudyMaterialService) private _studyMaterialService: IStudyMaterialService
  ) {}

  public start(): void {
    logger.info('Starting Cron Jobs...');

    // 1. Notification Queue Processor (Every 1 minute)
    nodeCron.schedule('* * * * *', () => {
      this._notificationService.processQueue().catch(err => logger.error('Cron Error (Queue):', err));
    });

    // 2. Session Join Link Activation (Every 15 minutes)
    // Time window: Sessions starting in the next 24 hours
    nodeCron.schedule('*/15 * * * *', () => {
      this._activateJoinLinks().catch(err => logger.error('Cron Error (Join Links):', err));
    });

    // 3. Slot Generation (Every Day at Midnight)
    // Projects slots for the next 7 days
    nodeCron.schedule('0 0 * * *', () => {
      this._schedulingService.generateSlots(7).catch(err => logger.error('Cron Error (Slot Gen):', err));
    });

    // 4. Assignment Reminders (Every Day at 9 AM IST = 3:30 AM UTC)
    // Time window: Assignments due in the next 24 hours
    nodeCron.schedule('30 3 * * *', () => {
      this._sendAssignmentReminders().catch(err => logger.error('Cron Error (Assignment Reminders):', err));
    });


    // Run startup tasks
    this._runStartupTasks();
  }

  /**
   * Calculate time window for join link activation and delegate to service.
   * Window: Now to 24 hours from now
   */
  private async _activateJoinLinks(): Promise<void> {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    logger.debug(`[Cron] Activating join links for window: ${now.toISOString()} to ${twentyFourHoursLater.toISOString()}`);
    
    await this._sessionService.activateJoinLinksForTimeWindow(now, twentyFourHoursLater);
  }

  /**
   * Calculate time window for assignment reminders and delegate to service.
   * Window: Now to 24 hours from now
   */
  private async _sendAssignmentReminders(): Promise<void> {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    logger.info('[Cron] Triggering assignment reminders');
    
    await this._studyMaterialService.sendDueReminders(now, twentyFourHoursLater);
  }

  /**
   * Run initial tasks on startup for dev/testing reliability.
   */
  private _runStartupTasks(): void {
    this._schedulingService.generateSlots(7)
      .then(() => {
        logger.info('Initial Slot Generation completed on startup');
        return this._activateJoinLinks();
      })
      .catch(err => logger.error('Startup Task Error:', err));
  }
}
