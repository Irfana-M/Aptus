import axios from "axios";
import { AuthContext } from "../utils/authContext";

/**
 * Standard API Response structure
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

/**
 * Paginated API Response structure
 */
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

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
    const activeRole = authContext.getCurrentRole();
    const token = authContext.getTokenForCurrentRole();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      
      // Send the active role as a hint to the backend
      if (activeRole) {
        config.headers['X-User-Role'] = activeRole;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
