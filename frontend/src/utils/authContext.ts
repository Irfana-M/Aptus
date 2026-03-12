export class AuthContext {
  private static instance: AuthContext;
  private currentRole: "admin" | "student" | "mentor" | null = null;

  private constructor() {
    const savedRole = sessionStorage.getItem("active_role");
    if (savedRole) {
      this.currentRole = savedRole as "admin" | "student" | "mentor";
    }
  }

  static getInstance(): AuthContext {
    if (!this.instance) {
      this.instance = new AuthContext();
    }
    return this.instance;
  }

  setRole(role: "admin" | "student" | "mentor") {
    this.currentRole = role;
    sessionStorage.setItem("active_role", role);
  }

  getCurrentRole() {
    return this.currentRole;
  }

  clearRole() {
    this.currentRole = null;
    sessionStorage.removeItem("active_role");
  }
}
