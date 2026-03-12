export class TokenSelector {
  
  static getRoleForPath(path: string = window.location.pathname): string | null {
    
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/student')) return 'student';
    if (path.startsWith('/mentor')) return 'mentor';
    
    if (path === '/') {
      const adminToken = localStorage.getItem('admin_accessToken');
      const studentToken = localStorage.getItem('student_accessToken');
      const mentorToken = localStorage.getItem('mentor_accessToken');
      
      
      const tokenCount = [adminToken, studentToken, mentorToken].filter(Boolean).length;
      if (tokenCount === 1) {
        if (adminToken) return 'admin';
        if (studentToken) return 'student';
        if (mentorToken) return 'mentor';
      }
      
    }
    
    return null;
  }
  

  static getTokenForCurrentPath(): string | null {
    const role = this.getRoleForPath();
    if (!role) return null;
    
    return localStorage.getItem(`${role}_accessToken`);
  }
  
 
  static getTokenForPath(path: string): string | null {
    const role = this.getRoleForPath(path);
    if (!role) return null;
    
    return localStorage.getItem(`${role}_accessToken`);
  }

  static shouldRedirectFromLanding(): { shouldRedirect: boolean; target: string } {
    const path = window.location.pathname;
    
    if (path !== '/') {
      return { shouldRedirect: false, target: '' };
    }
    
    const adminToken = localStorage.getItem('admin_accessToken');
    const studentToken = localStorage.getItem('student_accessToken');
    const mentorToken = localStorage.getItem('mentor_accessToken');
    
    
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
  
 
  static clearAllTokens(): void {
    localStorage.removeItem('admin_accessToken');
    localStorage.removeItem('student_accessToken');
    localStorage.removeItem('mentor_accessToken');
    localStorage.removeItem('accessToken'); 
    localStorage.removeItem('userRole'); 
    sessionStorage.removeItem('active_role');
  }

  static clearTokensForRole(role: 'admin' | 'student' | 'mentor'): void {
    localStorage.removeItem(`${role}_accessToken`);
    
    const activeRole = sessionStorage.getItem('active_role');
    if (activeRole === role) {
      sessionStorage.removeItem('active_role');
    }
  }
}
