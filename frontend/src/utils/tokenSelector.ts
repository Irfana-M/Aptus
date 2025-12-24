/**
 * TokenSelector - Centralized token selection based on URL path
 * This eliminates reliance on localStorage.userRole and prevents token contamination
 */

export class TokenSelector {
  /**
   * Get role from path (or infer from tokens for landing page)
   */
  static getRoleForPath(path: string = window.location.pathname): string | null {
    // First, check explicit paths
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/student')) return 'student';
    if (path.startsWith('/mentor')) return 'mentor';
    
    // For landing page (/), check which tokens exist
    if (path === '/') {
      const adminToken = localStorage.getItem('admin_accessToken');
      const studentToken = localStorage.getItem('student_accessToken');
      const mentorToken = localStorage.getItem('mentor_accessToken');
      
      // If only one token exists, use that role
      const tokenCount = [adminToken, studentToken, mentorToken].filter(Boolean).length;
      if (tokenCount === 1) {
        if (adminToken) return 'admin';
        if (studentToken) return 'student';
        if (mentorToken) return 'mentor';
      }
      // If multiple tokens exist, don't auto-select
    }
    
    return null;
  }
  
  /**
   * Get token for current path
   */
  static getTokenForCurrentPath(): string | null {
    const role = this.getRoleForPath();
    if (!role) return null;
    
    return localStorage.getItem(`${role}_accessToken`);
  }
  
  /**
   * Get token for specific path (useful for API calls)
   */
  static getTokenForPath(path: string): string | null {
    const role = this.getRoleForPath(path);
    if (!role) return null;
    
    return localStorage.getItem(`${role}_accessToken`);
  }
  
  /**
   * Check if we should redirect from landing page
   */
  static shouldRedirectFromLanding(): { shouldRedirect: boolean; target: string } {
    const path = window.location.pathname;
    
    if (path !== '/') {
      return { shouldRedirect: false, target: '' };
    }
    
    const adminToken = localStorage.getItem('admin_accessToken');
    const studentToken = localStorage.getItem('student_accessToken');
    const mentorToken = localStorage.getItem('mentor_accessToken');
    
    // If only one token exists, redirect to appropriate dashboard
    const tokens = { adminToken, studentToken, mentorToken };
    const validTokens = Object.entries(tokens).filter(([, token]) => token);
    
    if (validTokens.length === 1) {
      const [roleKey] = validTokens[0][0].split('Token');
      return {
        shouldRedirect: true,
        target: `/${roleKey}/dashboard`
      };
    }
    
    return { shouldRedirect: false, target: '' };
  }
  
  /**
   * Clear all authentication tokens
   */
  static clearAllTokens(): void {
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('student_accessToken');
    localStorage.removeItem('mentor_accessToken');
    localStorage.removeItem('accessToken'); // Legacy
    localStorage.removeItem('userRole'); // Legacy - causes contamination
    sessionStorage.removeItem('active_role');
  }
  
  /**
   * Clear tokens for specific role
   */
  static clearTokensForRole(role: 'admin' | 'student' | 'mentor'): void {
    localStorage.removeItem(`${role}_accessToken`);
    
    // Clear session role if it matches
    const activeRole = sessionStorage.getItem('active_role');
    if (activeRole === role) {
      sessionStorage.removeItem('active_role');
    }
  }
}
