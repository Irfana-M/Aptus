import nodeCron from 'node-cron';
import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { INotificationService } from '../interfaces/services/INotificationService';
import type { IBookingRepository } from '../interfaces/repositories/IBookingRepository';
import type { ITimeSlotRepository } from '../interfaces/repositories/ITimeSlotRepository';
import type { ISessionAccessService } from '../interfaces/services/ISessionAccessService';
import { logger } from '../utils/logger';

@injectable()
export class CronService {
  constructor(
    @inject(TYPES.INotificationService) private _notificationService: INotificationService,
    @inject(TYPES.IBookingRepository) private _bookingRepo: IBookingRepository,
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: ITimeSlotRepository,
    @inject(TYPES.ISessionAccessService) private _sessionAccessService: ISessionAccessService
  ) {}

  public start(): void {
    logger.info('Starting Cron Jobs...');

    // 1. Notification Queue Processor (Every 1 minute)
    nodeCron.schedule('* * * * *', () => {
      this._notificationService.processQueue().catch(err => logger.error('Cron Error (Queue):', err));
    });

    // 2. Reminders & Join Link Activation (Every 15 minutes)
    nodeCron.schedule('*/15 * * * *', () => {
      this._runScheduledTasks().catch(err => logger.error('Cron Error (Tasks):', err));
    });
  }

  private async _runScheduledTasks(): Promise<void> {
    const now = new Date();
    
    // REMINDERS: 24h and 1h sessions
    const sessionRanges = [
        { type: 'reminder_24h' as const, start: 23.75, end: 24.25 },
        { type: 'reminder_1h' as const, start: 0.75, end: 1.25 }
    ];

    for (const range of sessionRanges) {
        const from = new Date(now.getTime() + range.start * 60 * 60 * 1000);
        const to = new Date(now.getTime() + range.end * 60 * 60 * 1000);

        // This is a simplification. Ideally we'd query ITimeSlotRepository 
        // for slots in this range, then find associated Bookings.
        logger.debug(`Checking ${range.type} for sessions between ${from.toISOString()} and ${to.toISOString()}`);
        
        // Mocking finding bookings (replace with repo call)
        // const bookings = await this._bookingRepo.findBookingsStartingBetween(from, to);
    }

    // JOIN LINK ACTIVATION (~10 mins before)
    // Find sessions starting in 10-15 mins
    const activationFrom = new Date(now.getTime() + 10 * 60 * 1000);
    const activationTo = new Date(now.getTime() + 15 * 60 * 1000);
    
    logger.debug(`Checking join link activation for sessions between ${activationFrom.toISOString()} and ${activationTo.toISOString()}`);
    // For each session starting soon, generate join link and notify user
  }
}
