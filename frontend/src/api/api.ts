import axios from "axios";
export type { ApiResponse, PaginatedResponse } from "../types/api.types";
import { AuthContext } from "../utils/authContext";


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});


api.interceptors.request.use(
  (config) => {
    const authContext = AuthContext.getInstance();
    
    // Ensure role is synchronized with current path for the interceptor
    authContext.setRoleFromPath(window.location.pathname);
    
    const activeRole = authContext.getCurrentRole();

    const token = authContext.getTokenForCurrentRole();
console.log(`getTokenFromCurrentRole:${token}`);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (activeRole) {
      config.headers['X-User-Role'] = activeRole;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};


api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      
      const isAuthRoute = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/refresh');
      
      if (isAuthRoute) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        
        const authContext = AuthContext.getInstance();
        const role = authContext.getCurrentRole();
        const refreshPath = role === 'admin' ? '/admin/refresh' : '/auth/refresh';

        
        const refreshResponse = await axios.post(
          `${import.meta.env.VITE_API_URL}${refreshPath}`,
          {},
          { withCredentials: true }
        );

        const { accessToken, user } = refreshResponse.data;

        if (accessToken && user?.role) {
          
          localStorage.setItem(`${user.role}_accessToken`, accessToken);
          localStorage.setItem("userRole", user.role);

          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          processQueue(null, accessToken);
          isRefreshing = false;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // DEFENSIVE GUARD: Don't wipe tokens if we have a fresh valid session
        // (e.g. Google OAuth finished while this refresh was backgrounding)
        const authContext = AuthContext.getInstance();
        const hasToken = !!authContext.getTokenForCurrentRole();
        
        import("../app/store").then(({ store }) => {
            const hasUserInRedux = !!store.getState().auth.user;
            if (hasToken || hasUserInRedux) {
                console.warn("🛡️ api.ts: Refresh failed but current session looks valid. SKIP CLEARING.");
                return;
            }

            console.warn("🚨 api.ts: Refresh failed, CLEARING localStorage!");
            const roles = ['admin', 'student', 'mentor'];
            roles.forEach(role => localStorage.removeItem(`${role}_accessToken`));
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            sessionStorage.clear();
        });

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
