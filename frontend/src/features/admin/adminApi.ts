import api from "../../api/api"; 
import type { LoginResponse } from "../../types/dtoTypes";

export interface AdminLoginDto {
  email: string;
  password: string;
}

export const adminApi = {
  login: (data: AdminLoginDto) => api.post<LoginResponse>("/admin/login", data),
  logout: () => api.post<{ message: string }>("/admin/logout"),
 
};
