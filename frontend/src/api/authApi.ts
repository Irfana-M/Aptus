import api from "./api";
import { store } from "../app/store";
import { refreshAccessToken } from "../features/auth/authThunks";
import { logout } from "../features/auth/authSlice";
import { logoutAdmin } from "../features/admin/adminSlice";
import { refreshAdminToken } from "../features/admin/adminThunk";
import type { AxiosRequestConfig } from "axios";

interface OriginalRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

const authApi = api.create({ withCredentials: true });



authApi.interceptors.request.use(
  (config) => {
    const state = store.getState();

    
    const token =
      state.admin.accessToken || 
      state.auth.accessToken ||
      localStorage.getItem("accessToken");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as OriginalRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        let result;
        const state = store.getState();
        
        // Check if we are an admin based on state or localStorage
        const isAdmin = state.admin.accessToken || localStorage.getItem("isAdmin") === "true";
        
        if (isAdmin) {
           result = await store.dispatch(refreshAdminToken() as any);
        } else {
           result = await store.dispatch(refreshAccessToken() as any);
        }
        const newAccessToken = result.payload?.accessToken;

        if (newAccessToken) {
          if (originalRequest.headers) {
             originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          // Update localStorage if we refreshed successfully
          localStorage.setItem("accessToken", newAccessToken);
        }

        return authApi(originalRequest);
      } catch {
        const state = store.getState();
        const isAdmin = localStorage.getItem("isAdmin") === "true";

        if (state.admin.admin || isAdmin) {
          store.dispatch(logoutAdmin());
          window.location.href = "/admin/login";
        } else {
          store.dispatch(logout());
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);



// authApi.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config as OriginalRequestConfig;

//     if (error.response?.status === 401 && !originalRequest._retry) {
//       originalRequest._retry = true;
//       try {
//         const result = await store.dispatch(refreshAccessToken() as any);
//         const newAccessToken = result.payload?.accessToken;

//         if (newAccessToken && originalRequest.headers) {
//           originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
//         }

//         return authApi(originalRequest);
//       } catch (err) {
//         const state = store.getState();
//         if (state.admin.admin) {
//           store.dispatch(logoutAdmin());
//           window.location.href = "/admin/login";
//         } else {
//           store.dispatch(logout());
//           window.location.href = "/login";
//         }
//         return Promise.reject(err);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

export default authApi;
