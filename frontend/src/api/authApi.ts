import api from "./api"; 
import { store } from "../app/store";
import { refreshAccessToken } from "../features/auth/authThunks";

const authApi = api.create({
  withCredentials: true, 
});

authApi.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;
    if (accessToken && config.headers) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        
        const result = await store.dispatch(refreshAccessToken() as any);
        const newAccessToken = (result.payload as { accessToken: string }).accessToken;

        
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        return authApi(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default authApi;
