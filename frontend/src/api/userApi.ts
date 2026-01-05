import axios from "axios";
import { store } from "../app/store";
import { refreshAccessToken } from "../features/auth/authThunks";
import { logout } from "../features/auth/authSlice";
import type { AxiosRequestConfig } from "axios";

interface OriginalRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const userApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

userApi.interceptors.request.use(
  (config) => {
    const path = window.location.pathname;
    let token = null;
    
    // Path-based token selection
    if (path.startsWith('/student') || path.includes('/feedback')) {
      token = localStorage.getItem('student_accessToken') || localStorage.getItem('accessToken');
    } else if (path.startsWith('/mentor')) {
      token = localStorage.getItem('mentor_accessToken') || localStorage.getItem('accessToken');
    } else if (path.includes('/trial-class/')) {
      // For shared routes, try to find ANY valid token, prioritizing the one matching localStorage userRole
      const savedRole = localStorage.getItem('userRole');
      if (savedRole === 'student') token = localStorage.getItem('student_accessToken');
      else if (savedRole === 'mentor') token = localStorage.getItem('mentor_accessToken');
      
      token = token || localStorage.getItem('student_accessToken') || 
               localStorage.getItem('mentor_accessToken') || 
               localStorage.getItem('accessToken');
    } else if (path === '/') {
      // Landing page - check request URL
      const isStudentRequest = config.url?.includes('/student/') || config.url?.includes('/auth/');
      const isMentorRequest = config.url?.includes('/mentor/');
      
      if (isStudentRequest) {
        token = localStorage.getItem('student_accessToken') || localStorage.getItem('accessToken');
      } else if (isMentorRequest) {
        token = localStorage.getItem('mentor_accessToken') || localStorage.getItem('accessToken');
      }
    }

    // Comprehensive Fallback if no token found yet
    if (!token) {
      const savedRole = localStorage.getItem('userRole');
      if (savedRole === 'student') {
        token = localStorage.getItem('student_accessToken') || localStorage.getItem('accessToken');
      } else if (savedRole === 'mentor') {
        token = localStorage.getItem('mentor_accessToken') || localStorage.getItem('accessToken');
      }
      
      // Ultimate fallback: check any available token
      token = token || localStorage.getItem('student_accessToken') || 
               localStorage.getItem('mentor_accessToken') || 
               localStorage.getItem('accessToken');
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: Error) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

userApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as OriginalRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
         return new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
         }).then((token) => {
             if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
             }
             return userApi(originalRequest);
         }).catch((err) => {
             return Promise.reject(err);
         });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const result = await store.dispatch(refreshAccessToken());
        
        if (refreshAccessToken.fulfilled.match(result)) {
           const newAccessToken = result.payload.accessToken;

           if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
           }
           
           const state = store.getState();
           const userRole = state.auth.user?.role || localStorage.getItem("userRole");
           const tokenKey = userRole ? `${userRole}_accessToken` : "accessToken";
           
           localStorage.setItem(tokenKey, newAccessToken);

           processQueue(null, newAccessToken);
           isRefreshing = false;

           return userApi(originalRequest);
        } else {
          processQueue(new Error('Token refresh failed'), null);
          isRefreshing = false;

          console.log('🔐 User token refresh failed, logging out...');
          store.dispatch(logout());

        const state = store.getState();
        const userRole = state.auth.user?.role || localStorage.getItem("userRole");
        const tokenKey = userRole ? `${userRole}_accessToken` : "accessToken";
        
        if (tokenKey) localStorage.removeItem(tokenKey);
        
        // Also ensure shared keys are cleared
        const sharedKeys = ["accessToken", "userRole", "userId", "isTrialCompleted", "isProfileComplete", "hasPaid"];
        sharedKeys.forEach(k => localStorage.removeItem(k));
          window.location.href = "/login";
          return Promise.reject(new Error('Token refresh failed'));
        }
      } catch (refreshError) {
        processQueue(refreshError instanceof Error ? refreshError : new Error('Unknown error'), null);
        isRefreshing = false;

        store.dispatch(logout());
        const state = store.getState();
        const userRole = state.auth.user?.role || localStorage.getItem("userRole");
        const tokenKey = userRole ? `${userRole}_accessToken` : "accessToken";
        
        if (tokenKey) localStorage.removeItem(tokenKey);
        
        const sharedKeys = ["accessToken", "userRole", "userId", "isTrialCompleted", "isProfileComplete", "hasPaid"];
        sharedKeys.forEach(k => localStorage.removeItem(k));
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const getUserNotifications = async () => {
  const response = await userApi.get("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (id: string) => {
  const response = await userApi.patch(`/notifications/${id}/read`);
  return response.data;
};

export const getStudentUpcomingSessions = async () => {
    const response = await userApi.get("/sessions/student/upcoming");
    return response.data;
}

export const getMentorUpcomingSessions = async () => {
    const response = await userApi.get("/sessions/mentor/upcoming");
    return response.data;
}

export const getMentorTodaySessions = async () => {
    const response = await userApi.get("/sessions/mentor/today");
    return response.data;
}

export default userApi;
