import api from "../../api/api"; 
import type { AdminLoginResponse } from "../../types/dtoTypes";

export interface AdminLoginDto {
  email: string;
  password: string;
}

export const adminApi = {
  login: (data: AdminLoginDto) => api.post<AdminLoginResponse>("/admin/login", data),
  logout: () => api.post<{ message: string }>("/admin/logout"),
 
};
