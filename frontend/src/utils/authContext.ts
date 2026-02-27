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

    // Shared routes checking
    const sharedRoutes = ['/trial-class/', '/session/', '/notifications', '/classroom/'];
    if (sharedRoutes.some(p => path.startsWith(p))) {
      // 1. For classroom token links, role is in the token
      if (path.startsWith('/classroom/')) {
        const urlToken = path.split('/').pop();
        if (urlToken && urlToken.includes('.')) {
          try {
            const payload = JSON.parse(atob(urlToken.split('.')[1]));
            if (payload.role) return payload.role as 'admin' | 'student' | 'mentor';
          } catch {
            // Ignore decode errors
          }
        }
      }

      // 2. Check preference/cached role for this browser/tab
      const userRolePref = localStorage.getItem('userRole');
      if (userRolePref && ['admin', 'student', 'mentor'].includes(userRolePref)) {
         // Verify we actually have a token for this role before committing
         if (localStorage.getItem(`${userRolePref}_accessToken`)) {
             return userRolePref as 'admin' | 'student' | 'mentor';
         }
      }

      // 3. Fallback heuristics if no preference (least reliable)
      if (localStorage.getItem('student_accessToken')) return 'student';
      if (localStorage.getItem('mentor_accessToken')) return 'mentor';
      if (localStorage.getItem('admin_accessToken')) return 'admin';
    }
    return null;
  }
  
  /**
   * Set role explicitly and lock it for this tab session
   */
  setRole(role: 'admin' | 'student' | 'mentor'): void {
    this.currentRole = role;
    sessionStorage.setItem('active_role', role);
    localStorage.setItem('userRole', role); // Also sync localStorage for other components
    console.log(`🔒 Role explicitly set and locked: ${role}`);
  }
  
  /**
   * Set role based on path and lock it for this tab session
   */
  setRoleFromPath(path: string): void {
    const pathRole = this.getRoleFromPath(path);
    
    if (pathRole) {
      this.setRole(pathRole);
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
   * Get token for current role.
   * Checks role-specific localStorage keys directly so this works on shared
   * routes (/trial-class/, /session/) where sessionStorage.active_role and
   * localStorage.userRole may not be populated.
   */
  getTokenForCurrentRole(): string | null {
    // 1. Prefer the explicitly locked role for this tab (most accurate)
    const role = this.getCurrentRole();
    if (role) {
      const roleToken = localStorage.getItem(`${role}_accessToken`);
      if (roleToken) return roleToken;
    }

    // 2. Direct key fallback — works even when active_role / userRole are absent
    return (
      localStorage.getItem('student_accessToken') ||
      localStorage.getItem('mentor_accessToken') ||
      null
    );
  }
}
