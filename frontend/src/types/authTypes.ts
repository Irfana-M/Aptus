export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "student" | "mentor";
  isVerified: boolean;
  accessToken?: string;
  isProfileComplete?: boolean;
  hasPaid?: boolean;
  isTrialCompleted?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected" | "pending-approval";
  profilePicture?: string;
  referralCode?: string;
  subscription?: {
    status: 'active' | 'expired' | 'cancelled';
    endDate: Date | string;
    plan: 'monthly' | 'yearly';
    subjectCount?: number;
  };
  profileImageUrl?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  onboardingStatus?: 'registered' | 'profile_complete' | 'trial_booked' | 'trial_attended' | 'feedback_submitted' | 'subscribed' | 'preferences_completed';
  preferencesCompleted?: boolean;
}

export interface AuthState {
  loading: boolean;
  user: User | null;
  accessToken: string | null;
  error: string | null;
  isVerified: boolean;
  isAuthenticated?: boolean;
  isProfileComplete?: boolean;
  hasPaid?: boolean;
  isTrialCompleted?: boolean;
}
