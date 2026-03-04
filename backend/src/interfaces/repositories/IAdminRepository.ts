import type { IAdmin } from "../models/admin.interface.js";

export interface IAdminRepository {
  findAll(): Promise<IAdmin[]>;
  findByEmail(email: string): Promise<IAdmin | null>;
  create(admin: Partial<IAdmin>): Promise<IAdmin>;
}
