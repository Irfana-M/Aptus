import nodeCron from 'node-cron';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types.js';
import type { INotificationService } from '../interfaces/services/INotificationService.js';
import type { ISchedulingService } from '../interfaces/services/ISchedulingService.js';
import type { ISessionService } from '../interfaces/services/ISessionService.js';
import type { IStudyMaterialService } from '../interfaces/services/IStudyMaterialService.js';
import { logger } from '../utils/logger.js';

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

    
    nodeCron.schedule('* * * * *', () => {
      this._notificationService.processQueue().catch(err => logger.error('Cron Error (Queue):', err));
    });

   
    nodeCron.schedule('*/15 * * * *', () => {
      this._activateJoinLinks().catch(err => logger.error('Cron Error (Join Links):', err));
    });

    
    nodeCron.schedule('0 0 * * *', () => {
      this._schedulingService.generateSlots(7).catch(err => logger.error('Cron Error (Slot Gen):', err));
    });

    
    nodeCron.schedule('30 3 * * *', () => {
      this._sendAssignmentReminders().catch(err => logger.error('Cron Error (Assignment Reminders):', err));
    });


   
    this._runStartupTasks();
  }

 
  private async _activateJoinLinks(): Promise<void> {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    logger.debug(`[Cron] Activating join links for window: ${now.toISOString()} to ${twentyFourHoursLater.toISOString()}`);
    
    await this._sessionService.activateJoinLinksForTimeWindow(now, twentyFourHoursLater);
  }

  
  private async _sendAssignmentReminders(): Promise<void> {
    const now = new Date();
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    logger.info('[Cron] Triggering assignment reminders');
    
    await this._studyMaterialService.sendDueReminders(now, twentyFourHoursLater);
  }

  
  private _runStartupTasks(): void {
    this._schedulingService.generateSlots(7)
      .then(() => {
        logger.info('Initial Slot Generation completed on startup');
        return this._activateJoinLinks();
      })
      .catch(err => logger.error('Startup Task Error:', err));
  }
}
