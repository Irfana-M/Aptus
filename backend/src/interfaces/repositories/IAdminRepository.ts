import { Admin } from "../../models/admin/admin.model";
import type { IAdmin } from "../models/admin.interface";
import type { StudentProfile } from "../models/student.interface";
import type { MentorProfile } from "../models/mentor.interface";

export interface IAdminRepository {
  findByEmail(email: string): Promise<IAdmin | null>;
  create(admin: Partial<IAdmin>): Promise<IAdmin>;
}
