export type UserRole = "student" | "mentor" | "admin";

export const TokenManager = {
  setToken(role: UserRole, token: string) {
    localStorage.setItem(`${role}_accessToken`, token);
    localStorage.setItem("userRole", role);
  },

  getToken(role?: UserRole): string | null {
    const currentRole = role || (localStorage.getItem("userRole") as UserRole);
    if (!currentRole) return null;

    return localStorage.getItem(`${currentRole}_accessToken`);
  },

  getRole(): UserRole | null {
    return localStorage.getItem("userRole") as UserRole | null;
  },

  clearToken(role?: UserRole) {
    const currentRole = role || (localStorage.getItem("userRole") as UserRole);
    if (!currentRole) return;

    localStorage.removeItem(`${currentRole}_accessToken`);
    localStorage.removeItem("userRole");
  },

  clearAllTokens() {
    localStorage.removeItem("student_accessToken");
    localStorage.removeItem("mentor_accessToken");
    localStorage.removeItem("admin_accessToken");
    localStorage.removeItem("userRole");
  }
};
export const decodeJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};