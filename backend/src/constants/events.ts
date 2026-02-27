export enum DomainEvent {
  // Mentor related
  MENTOR_APPROVED = 'mentor.approved',
  MENTOR_REJECTED = 'mentor.rejected',
  MENTOR_ASSIGNED = 'mentor.assigned',
  MENTOR_REASSIGNED = 'mentor.reassigned',
  MENTOR_REQUEST_SUBMITTED = 'mentor.request_submitted',
  MENTOR_REQUEST_REJECTED = 'mentor.request_rejected',

  // Trial related
  TRIAL_BOOKED = 'trial.booked',
  TRIAL_MENTOR_ASSIGNED = 'trial.mentor_assigned',
  TRIAL_COMPLETED = 'trial.completed',

  // Session related
  SESSION_SCHEDULED = 'session.scheduled',
  SESSION_CANCELLED = 'session.cancelled',
  SESSION_RESCHEDULED = 'session.rescheduled',
  SESSION_STARTING = 'session.starting',
  GROUP_CLASS_JOINED = 'group_class.joined',

  // Subscription related
  SUBSCRIPTION_ACTIVATED = 'subscription.activated',
  SUBSCRIPTION_EXPIRED = 'subscription.expired',

  // Profile/Onboarding
  PREFERENCES_SUBMITTED = 'preferences.submitted',
  USER_REGISTERED = 'user.registered',

  // Legacy/Internal
  BOOKING_CREATED = 'booking.created',
  BOOKING_CANCELLED = 'booking.cancelled',
  BOOKING_RESCHEDULED = 'booking.rescheduled',
  // Course related
  COURSE_REQUEST_SUBMITTED = 'course.request_submitted',
  MENTOR_STUDENT_ASSIGNED = 'mentor.student_assigned',
}
