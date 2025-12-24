/**
 * AuthContext - Manages authentication context with tab isolation
 * Prevents role switching within the same browser tab
 */

export class AuthContext {
  private static instance: AuthContext;
  private currentRole: 'admin' | 'student' | 'mentor' | null = null;
  
  private constructor() {
    // Restore role from sessionStorage on initialization
    const savedRole = sessionStorage.getItem('active_role');
    if (savedRole && ['admin', 'student', 'mentor'].includes(savedRole)) {
      this.currentRole = savedRole as 'admin' | 'student' | 'mentor';
    }
  }
  
  static getInstance(): AuthContext {
    if (!this.instance) {
      this.instance = new AuthContext();
    }
    return this.instance;
  }
  
  /**
   * Get role from path
   */
  private getRoleFromPath(path: string): 'admin' | 'student' | 'mentor' | null {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/student')) return 'student';
    if (path.startsWith('/mentor')) return 'mentor';
    return null;
  }
  
  /**
   * Set role based on path and lock it for this tab session
   */
  setRoleFromPath(path: string): void {
    const pathRole = this.getRoleFromPath(path);
    
    if (pathRole) {
      this.currentRole = pathRole;
      sessionStorage.setItem('active_role', pathRole);
      console.log(`🔒 Role locked for this tab: ${pathRole}`);
    }
  }
  
  /**
   * Get current active role for this tab
   */
  getCurrentRole(): 'admin' | 'student' | 'mentor' | null {
    return this.currentRole || (sessionStorage.getItem('active_role') as 'admin' | 'student' | 'mentor' | null);
  }
  
  /**
   * Validate if the requested path matches the current tab's role
   * Prevents role switching within the same tab
   */
  validateRoleForPath(path: string): boolean {
    const pathRole = this.getRoleFromPath(path);
    const currentRole = this.getCurrentRole();
    
    // Landing page is always allowed
    if (path === '/') return true;
    
    // If no current role, allow (first navigation)
    if (!currentRole) return true;
    
    // If no path role (public route), allow
    if (!pathRole) return true;
    
    // Check if roles match
    if (currentRole !== pathRole) {
      console.warn(`🚫 Role mismatch: trying to access ${pathRole} path with ${currentRole} session`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Clear role for this tab (on logout)
   */
  clearRole(): void {
    this.currentRole = null;
    sessionStorage.removeItem('active_role');
    console.log('🔓 Role cleared for this tab');
  }
  
  /**
   * Check if user has token for specific role
   */
  hasTokenForRole(role: 'admin' | 'student' | 'mentor'): boolean {
    return !!localStorage.getItem(`${role}_accessToken`);
  }
  
  /**
   * Get token for current role
   */
  getTokenForCurrentRole(): string | null {
    const role = this.getCurrentRole();
    if (!role) return null;
    
    return localStorage.getItem(`${role}_accessToken`);
  }
}
