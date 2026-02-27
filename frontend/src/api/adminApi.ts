import axios from "axios";
import { store } from "../app/store";
import { refreshAdminToken } from "../features/admin/adminThunk";
import { logoutAdmin } from "../features/admin/adminSlice";
import type { AxiosRequestConfig } from "axios";

interface OriginalRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

adminApi.interceptors.request.use(
  (config) => {
    // STRICT: Only use admin token, no fallbacks
    const token = localStorage.getItem('admin_accessToken');

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

adminApi.interceptors.response.use(
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
             return adminApi(originalRequest);
         }).catch((err) => {
             return Promise.reject(err);
         });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const result = await store.dispatch(refreshAdminToken());
        
        if (refreshAdminToken.fulfilled.match(result)) {
           const newAccessToken = result.payload.accessToken;

           if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
           }
           
           localStorage.setItem("admin_accessToken", newAccessToken);

           processQueue(null, newAccessToken);
           isRefreshing = false;

           return adminApi(originalRequest);
        } else {
          processQueue(new Error('Admin token refresh failed'), null);
          isRefreshing = false;

          store.dispatch(logoutAdmin());
          localStorage.removeItem("admin_accessToken");
          localStorage.removeItem("adminAccessToken");
          sessionStorage.removeItem("active_role");
          window.location.href = "/admin/login";
          return Promise.reject(new Error('Admin token refresh failed'));
        }
      } catch (refreshError) {
        processQueue(refreshError instanceof Error ? refreshError : new Error('Unknown error'), null);
        isRefreshing = false;

        store.dispatch(logoutAdmin());
        localStorage.removeItem("admin_accessToken");
        localStorage.removeItem("adminAccessToken");
        sessionStorage.removeItem("active_role");
        window.location.href = "/admin/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default adminApi;
