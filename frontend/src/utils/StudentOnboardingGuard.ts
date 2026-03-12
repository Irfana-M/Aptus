import type { User } from '../types/auth.types';
import { ROUTES } from '../constants/routes.constants';

export const StudentOnboardingStatus = {
  REGISTERED: 'registered',
  PROFILE_COMPLETE: 'profile_complete',
  TRIAL_BOOKED: 'trial_booked', // Note: dashboard logic might override
  TRIAL_ATTENDED: 'trial_attended',
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  SUBSCRIBED: 'subscribed',
  PREFERENCES_COMPLETED: 'preferences_completed',
} as const;

export type StudentOnboardingStatus = typeof StudentOnboardingStatus[keyof typeof StudentOnboardingStatus];

class StudentOnboardingPolicy {
  private static readonly ROUTE_MAP: Record<StudentOnboardingStatus, string> = {
    [StudentOnboardingStatus.REGISTERED]: ROUTES.STUDENT.PROFILE_SETUP,
    [StudentOnboardingStatus.PROFILE_COMPLETE]: ROUTES.STUDENT.BOOK_FREE_TRIAL,
    [StudentOnboardingStatus.TRIAL_BOOKED]: ROUTES.STUDENT.DASHBOARD, // No dedicated pending page yet, use dashboard
    [StudentOnboardingStatus.TRIAL_ATTENDED]: ROUTES.COMMON.TRIAL_FEEDBACK,
    [StudentOnboardingStatus.FEEDBACK_SUBMITTED]: ROUTES.STUDENT.SUBSCRIPTION_PLANS,
    [StudentOnboardingStatus.SUBSCRIBED]: ROUTES.STUDENT.PREFERENCES.SUBJECTS,
    [StudentOnboardingStatus.PREFERENCES_COMPLETED]: ROUTES.STUDENT.DASHBOARD,
  };

  
  static getRequiredRoute(status: StudentOnboardingStatus): string {
    return this.ROUTE_MAP[status] || ROUTES.STUDENT.DASHBOARD;
  }
}


export function getStudentRedirect(user: User, currentPath: string): string | null {
  if (user.role !== 'student') return null;

  const statusOrder = [
    StudentOnboardingStatus.REGISTERED,
    StudentOnboardingStatus.PROFILE_COMPLETE,
    StudentOnboardingStatus.TRIAL_BOOKED,
    StudentOnboardingStatus.TRIAL_ATTENDED,
    StudentOnboardingStatus.FEEDBACK_SUBMITTED,
    StudentOnboardingStatus.SUBSCRIBED,
    StudentOnboardingStatus.PREFERENCES_COMPLETED,
  ];

  const status = user.onboardingStatus as StudentOnboardingStatus;

  if (!status) {
    console.log(" Status unknown - staying put while profile fetches");
    return null;
  }

  const requiredPath = StudentOnboardingPolicy.getRequiredRoute(status);
  if (currentPath.includes('/trial-class/') && currentPath.endsWith('/feedback')) {
    return null;
  }
  if (
    currentPath === requiredPath ||
    currentPath.startsWith(requiredPath + "/")
  ) {
    return null;
  }

  if (
    (status === StudentOnboardingStatus.TRIAL_ATTENDED ||
      status === StudentOnboardingStatus.FEEDBACK_SUBMITTED) &&
    currentPath === ROUTES.STUDENT.PAYMENT
  ) {
    return null;
  }

  if (currentPath === ROUTES.LOGIN || currentPath === ROUTES.REGISTER)
    return null;

  if (status === StudentOnboardingStatus.PREFERENCES_COMPLETED) return null;

  if (
    statusOrder.indexOf(status) >=
    statusOrder.indexOf(StudentOnboardingStatus.SUBSCRIBED) &&
    currentPath === ROUTES.STUDENT.SUBSCRIPTION_PLANS
  ) {
    return requiredPath;
  }

  if (
    statusOrder.indexOf(status) >=
    statusOrder.indexOf(StudentOnboardingStatus.TRIAL_BOOKED) &&
    (currentPath.startsWith(ROUTES.STUDENT.CLASSROOM) ||
      currentPath.startsWith(ROUTES.STUDENT.ATTENDANCE))
  ) {
    return null;
  }

  if (
    status === StudentOnboardingStatus.SUBSCRIBED &&
    currentPath.startsWith(
      ROUTES.STUDENT.PREFERENCES.SUBJECTS.split('/')
        .slice(0, 3)
        .join('/') + '/'
    )
  ) {
    return null;
  }

  return requiredPath;
}

