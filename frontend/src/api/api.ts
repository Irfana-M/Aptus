import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const path = window.location.pathname;
    let token = null;
    let roleHint = null;
    
    // Determine token based on current path
    if (path.startsWith('/admin')) {
      token = localStorage.getItem('admin_accessToken');
      roleHint = 'admin';
    } else if (path.startsWith('/student')) {
      token = localStorage.getItem('student_accessToken');
      roleHint = 'student';
    } else if (path.startsWith('/mentor')) {
      token = localStorage.getItem('mentor_accessToken');
      roleHint = 'mentor';
    } else if (path === '/') {
      // Landing page - determine from API endpoint
      const isAdminRequest = config.url?.includes('/admin/');
      const isStudentRequest = config.url?.includes('/student/') || config.url?.includes('/auth/');
      const isMentorRequest = config.url?.includes('/mentor/');
      
      if (isAdminRequest) {
        token = localStorage.getItem('admin_accessToken');
        roleHint = 'admin';
      } else if (isStudentRequest) {
        token = localStorage.getItem('student_accessToken') || localStorage.getItem('accessToken');
        roleHint = 'student';
      } else if (isMentorRequest) {
        token = localStorage.getItem('mentor_accessToken') || localStorage.getItem('accessToken');
        roleHint = 'mentor';
      } else {
        // Generic request - use any available token
        token = localStorage.getItem('student_accessToken') || 
                localStorage.getItem('mentor_accessToken') || 
                localStorage.getItem('admin_accessToken');
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Add role hint header for landing page requests
      if (roleHint) {
        config.headers['X-User-Role'] = roleHint;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
