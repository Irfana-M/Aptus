import type { IAdmin } from "../models/admin.interface";

export interface IAdminRepository {
  findAll(): Promise<IAdmin[]>;
  findByEmail(email: string): Promise<IAdmin | null>;
  create(admin: Partial<IAdmin>): Promise<IAdmin>;
}
