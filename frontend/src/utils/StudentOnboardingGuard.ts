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

  /**
   * Get the required route for a given status
   */
  static getRequiredRoute(status: StudentOnboardingStatus): string {
    return this.ROUTE_MAP[status] || ROUTES.STUDENT.DASHBOARD;
  }
}

/**
 * Guard function to determine if a student needs to be redirected
 * @param user The current user
 * @returns The path to redirect to, or null if no redirect is needed
 */
export function getStudentRedirect(user: User): string | null {
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

  // Strictly use onboardingStatus for routing decisions
  const status = user.onboardingStatus as StudentOnboardingStatus;
  
  if (!status) {
    console.log("🤫 Status unknown - staying put while profile fetches");
    return null;
  }
  
  const currentPath = window.location.pathname;
  const requiredPath = StudentOnboardingPolicy.getRequiredRoute(status);
  
  // ✅ Extract base route for child route matching (allow /student/profile-setup/edit etc)
  const requiredParts = requiredPath.split('/').filter(Boolean);
  const requiredBase = requiredParts.length >= 2 
    ? '/' + requiredParts.slice(0, 2).join('/')
    : requiredPath;
  
  // Allow child routes or exact match. We check if current path starts with required base route.
  if (currentPath === requiredPath || (requiredBase !== '/' && currentPath.startsWith(requiredBase))) return null;

  // 🔓 EXCEPTION: Allow payment page if they are in a state that requires subscription selection
  if ((status === StudentOnboardingStatus.TRIAL_ATTENDED || status === StudentOnboardingStatus.FEEDBACK_SUBMITTED) && 
      currentPath === ROUTES.STUDENT.PAYMENT) {
      return null;
  }
  
  // Special exception: Allow logout
  if (currentPath === ROUTES.LOGIN || currentPath === ROUTES.REGISTER) return null;

  // If status is PREFERENCES_COMPLETED, they can go anywhere (mostly)
  if (status === StudentOnboardingStatus.PREFERENCES_COMPLETED) return null;

  // 🔒 SPECIAL GUARD: Subscribed students should NEVER see the subscription plans page again
  if (statusOrder.indexOf(status) >= statusOrder.indexOf(StudentOnboardingStatus.SUBSCRIBED) && 
      currentPath === ROUTES.STUDENT.SUBSCRIPTION_PLANS) {
      return requiredPath;
  }

  // 🔓 EXCEPTION: Allow classroom and attendance for TRIAL_BOOKED and above
  if (statusOrder.indexOf(status) >= statusOrder.indexOf(StudentOnboardingStatus.TRIAL_BOOKED) && 
      (currentPath.startsWith(ROUTES.STUDENT.CLASSROOM) || currentPath.startsWith(ROUTES.STUDENT.ATTENDANCE))) {
    return null;
  }

  // 🔓 EXCEPTION: Allow flow navigation for SUBSCRIBED users (Subjects -> Time Slots -> Mentors)
  if (status === StudentOnboardingStatus.SUBSCRIBED && currentPath.startsWith(ROUTES.STUDENT.PREFERENCES.SUBJECTS.split('/').slice(0, 3).join('/') + '/')) {
    return null;
  }

  // Otherwise, strict enforcement for other states
  return requiredPath;
}

