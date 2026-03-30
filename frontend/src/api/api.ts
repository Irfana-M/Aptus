import axios from "axios";
import { TokenManager } from "../utils/tokenManager";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

const skip401For: string[] = [
  "/auth/login",
  "/auth/refresh",
  "/admin/login",
  "/admin/refresh"
];

api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;
    const isSkipped = skip401For.some((url: string) => config.url?.includes(url));

    if (error.response?.status === 401 && !isSkipped) {
      const justLoggedIn = sessionStorage.getItem("justLoggedIn");
      if (!justLoggedIn) {
        TokenManager.clearAllTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;