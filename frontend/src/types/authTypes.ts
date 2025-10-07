export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "mentor";
  isVerified: boolean;
  accessToken?: string;
}

export interface AuthState {
  loading: boolean;
  user: User | null;
  accessToken: string | null;
  error: string | null;
  isVerified: boolean;
  isAuthenticated?: boolean;
}
