import type { User } from "./user.types";
export type { User };

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
