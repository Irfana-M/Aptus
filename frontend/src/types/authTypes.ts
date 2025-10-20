export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "student" | "mentor";
  isVerified: boolean;
  accessToken?: string;
  isProfileComplete?: boolean; 
  isPaid?: boolean; 
}

export interface AuthState {
  loading: boolean;
  user: User | null;
  accessToken: string | null;
  error: string | null;
  isVerified: boolean;
  isAuthenticated?: boolean;
  isProfileComplete?: boolean; 
  isPaid?: boolean;
}
