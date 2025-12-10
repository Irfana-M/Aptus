import authApi from "../../api/authApi";

export interface VerifyRoleResponse {
  success: boolean;
  role?: 'mentor' | 'student';
  userId?: string;
  email?: string;
  user?: {
    id: string;
    email: string;
    role: 'mentor' | 'student';
    fullName?: string;
    name?: string;
    phoneNumber?: string;
  };
  tokenInfo?: {
    issuedAt: string;
    expiresAt: string;
  };
  verifiedAt: string; // Add this
}

export interface RoleOnlyResponse {
  success: boolean;
  role: string;
  userId: string;
  email: string;
}

export interface UserRoleByIdResponse {
  success: boolean;
  userId: string;
  role: string;
  email: string;
}

export const roleApi = {
  // USE THIS ONE — reads from Bearer token (RECOMMENDED & WORKING)
  verifyRoleWithToken: () => {
    return authApi.get<{
      success: boolean;
      role?: 'mentor' | 'student';
      userId?: string;
      email?: string;
      user?: any;
      tokenInfo?: {
        issuedAt: string;
        expiresAt: string;
      };
      verifiedAt?: string; // Make it optional
      [key: string]: any; // Allow additional properties
    }>('/role/verify');
  },

  // Lightweight version — just role + id (also works great)
  getRoleOnly: () => {
    return authApi.get<{ success: boolean; role: string; userId: string; email: string }>('/role-only');
  },

  // Optional: if you ever need by ID (now safe)
  getUserRoleById: (userId: string) => {
    return authApi.get(`/role/${userId}`);
  },
};