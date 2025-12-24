import userApi from "../../api/userApi";
import { API_ROUTES } from "../../constants/apiRoutes";

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
    return userApi.get<{
      success: boolean;
      role?: 'mentor' | 'student';
      userId?: string;
      email?: string;
      user?: VerifyRoleResponse['user'];
      tokenInfo?: {
        issuedAt: string;
        expiresAt: string;
      };
      verifiedAt?: string; // Make it optional
    }>(API_ROUTES.ROLE.VERIFY);
  },

  // Lightweight version — just role + id (also works great)
  getRoleOnly: () => {
    return userApi.get<{ success: boolean; role: string; userId: string; email: string }>(API_ROUTES.ROLE.ROLE_ONLY);
  },

  // Optional: if you ever need by ID (now safe)
  getUserRoleById: (userId: string) => {
    return userApi.get(API_ROUTES.ROLE.BY_ID.replace(":userId", userId));
  },
};