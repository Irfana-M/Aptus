import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import type { INotificationService } from '../interfaces/services/INotificationService';
import type { InternalEventEmitter } from '../utils/InternalEventEmitter';
import { EVENTS } from '../utils/InternalEventEmitter';
import { logger } from '../utils/logger';
import type { IAdminRepository } from '@/interfaces/repositories/IAdminRepository';
import type { NotificationType } from '@/interfaces/models/notification.interface';

@injectable()
export class NotificationManager {
  constructor(
    @inject(TYPES.InternalEventEmitter) private _eventEmitter: InternalEventEmitter,
    @inject(TYPES.INotificationService) private _notificationService: INotificationService,
    @inject(TYPES.IAdminRepository)
private _adminRepository: IAdminRepository
  ) {}

  public initialize(): void {
    logger.info('Initializing Notification Manager listeners...');

    // Mentor Approved/Rejected
    this._eventEmitter.on(EVENTS.MENTOR_APPROVED, async (data) => {
      try {
        await this._notificationService.notifyUser(
          data.mentorId,
          'mentor',
          'mentor_assigned', // Reusing mentor_assigned for approval for now or add new type
          { 
            message: `Your mentor profile has been ${data.status}.`,
            status: data.status,
            reason: data.reason
          },
          ['email', 'web']
        );
      } catch (error) {
        logger.error('Error handling MENTOR_APPROVED:', error);
      }
    });

    // Mentor Assigned (In a Course)
    this._eventEmitter.on(EVENTS.MENTOR_ASSIGNED, async (data) => {
      try {
        await Promise.all([
          // To Student
          this._notificationService.notifyUser(
            data.studentId,
            'student',
            'mentor_assigned',
            { 
              mentorName: data.mentorName, 
              subjectName: data.subjectName,
              message: `${data.mentorName} has been assigned as your mentor for ${data.subjectName}`
            }
          ),
          // To Mentor
          this._notificationService.notifyUser(
            data.mentorId,
            'mentor',
            'mentor_assigned',
            { 
              studentName: data.studentName, 
              subjectName: data.subjectName,
              message: `${data.studentName} has been assigned to you for ${data.subjectName}`
            }
          )
        ]);
      } catch (error) {
        logger.error('Error handling MENTOR_ASSIGNED:', error);
      }
    });

    // Trial Mentor Assigned
    this._eventEmitter.on(EVENTS.TRIAL_MENTOR_ASSIGNED, async (data) => {
      try {
        await this._notificationService.notifyUser(
          data.studentId,
          'student',
          'session_booked',
          { 
            mentorName: data.mentorName, 
            subjectName: data.subjectName,
            startTime: data.scheduledTime,
            message: `Trial session for ${data.subjectName} with ${data.mentorName} scheduled on ${data.scheduledDate} at ${data.scheduledTime}`
          }
        );
      } catch (error) {
        logger.error('Error handling TRIAL_MENTOR_ASSIGNED:', error);
      }
    });

    this._eventEmitter.on(EVENTS.SUBSCRIPTION_ACTIVATED, async (data) => {
      try {
        await this._notificationService.notifyUser(
          data.studentId,
          'student',
          'subscription_activated',
          { 
            plan: data.plan,
            message: `Your ${data.plan} subscription has been activated successfully!`
          }
        );
      } catch (error) {
        logger.error('Error handling SUBSCRIPTION_ACTIVATED:', error);
      }
    });

    // Session Scheduled
    this._eventEmitter.on(EVENTS.SESSION_SCHEDULED, async (data) => {
      try {
        await Promise.all([
          // Notify Student
          this._notificationService.notifyUser(
            data.studentId,
            'student',
            'session_booked',
            { 
              subjectName: data.subjectName,
              startTime: data.startTime,
              message: `New session for ${data.subjectName} scheduled for ${data.startTime}`
            }
          ),
          // Notify Mentor
          this._notificationService.notifyUser(
            data.mentorId,
            'mentor',
            'session_booked',
            { 
              subjectName: data.subjectName,
              startTime: data.startTime,
              message: `A student has booked a session for ${data.subjectName} in your slot on ${data.startTime}`
            }
          )
        ]);
      } catch (error) {
        logger.error('Error handling SESSION_SCHEDULED:', error);
      }
    });

    // Session Cancelled
    this._eventEmitter.on(EVENTS.SESSION_CANCELLED, async (data) => {
      try {
        await this._notificationService.notifyUser(
          data.studentId,
          'student',
          'session_cancelled',
          { 
            subjectName: data.subjectName,
            reason: data.reason,
            message: `Your session for ${data.subjectName} has been cancelled. ${data.reason ? `Reason: ${data.reason}` : ''}`
          }
        );
      } catch (error) {
        logger.error('Error handling SESSION_CANCELLED:', error);
      }
    });

    // Legacy Support
    this._eventEmitter.on(EVENTS.BOOKING_CREATED, async (data) => {
      try {
        logger.info(`Reacting to BOOKING_CREATED for student ${data.studentId}`);
        await this._notificationService.notifyUser(
          data.studentId,
          'student',
          'session_booked',
          { 
            subjectName: data.subjectName, 
            startTime: data.startTime,
            email: data.studentEmail 
          }
        );
      } catch (error) {
        logger.error('Error handling BOOKING_CREATED:', error);
      }
    });

    this._eventEmitter.on(EVENTS.BOOKING_CANCELLED, async (data) => {
      try {
        logger.info(`Reacting to BOOKING_CANCELLED for student ${data.studentId}`);
        await this._notificationService.notifyUser(
          data.studentId,
          'student',
          'session_cancelled',
          { 
            subjectName: data.subjectName,
            email: data.studentEmail 
          }
        );
      } catch (error) {
        logger.error('Error handling BOOKING_CANCELLED:', error);
      }
    });

    // Admin Notifications
    this._eventEmitter.on(EVENTS.MENTOR_REQUEST_SUBMITTED, async (data) => {
      try {
        await this.notifyAdmins('mentor_request_submitted', {
          studentName: data.studentName,
          mentorName: data.mentorName,
          subjectName: data.subjectName,
          message: `New mentor request submitted by ${data.studentName} for ${data.subjectName}`
        });
      } catch (error) {
        logger.error('Error handling MENTOR_REQUEST_SUBMITTED:', error);
      }
    });

    this._eventEmitter.on(EVENTS.PREFERENCES_SUBMITTED, async (data) => {
      try {
        await this.notifyAdmins('preferences_submitted', {
          studentName: data.studentName,
          subjectName: data.subjectName,
          message: `New preferences submitted by ${data.studentName} for ${data.subjectName}`
        });
      } catch (error) {
        logger.error('Error handling PREFERENCES_SUBMITTED:', error);
      }
    });

    this._eventEmitter.on(EVENTS.COURSE_REQUEST_SUBMITTED, async (data) => {
      try {
        await this.notifyAdmins('admin_course_request', {
          requestId: data.requestId,
          studentId: data.studentId,
          subject: data.subject,
          message: `New course request for ${data.subject} (${data.mentoringMode})`
        });
      } catch (error) {
        logger.error('Error handling COURSE_REQUEST_SUBMITTED:', error);
      }
    });

    this._eventEmitter.on(EVENTS.SUBSCRIPTION_ACTIVATED, async (data) => {
      try {
        await this.notifyAdmins('admin_subscription_activated', {
          studentName: data.studentName,
          plan: data.plan,
          message: `New student ${data.studentName} has subscribed to ${data.plan}`
        });
      } catch (error) {
        logger.error('Error handling SUBSCRIPTION_ACTIVATED:', error);
      }
    });

    this._eventEmitter.on(EVENTS.TRIAL_BOOKED, async (data) => {
      try {
        await this.notifyAdmins('admin_trial_booked', {
          studentName: data.studentName,
          subjectName: data.subjectName,
          message: `New trial class requested by ${data.studentName} for ${data.subjectName}`
        });
      } catch (error) {
        logger.error('Error handling TRIAL_BOOKED:', error);
      }
    });

    this._eventEmitter.on(EVENTS.USER_REGISTERED, async (data) => {
      try {
        await this.notifyAdmins('admin_user_registered', {
          email: data.email,
          role: data.role,
          fullName: data.fullName,
          message: `New ${data.role} registered: ${data.email} (${data.fullName || 'No Name'})`
        });
      } catch (error) {
        logger.error('Error handling USER_REGISTERED:', error);
      }
    });
  }

    private async notifyAdmins(
    type: NotificationType,
    payload: any
  ): Promise<void> {

    const admins = await this._adminRepository.findAll();

    if (!admins || admins.length === 0) {
      logger.warn('No admins found to notify');
      return;
    }

    await Promise.all(
      admins.map((admin) =>
        this._notificationService.notifyUser(
          admin._id.toString(),
          'admin',
          type,
          payload
        )
      )
    );
  }

}
