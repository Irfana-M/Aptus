import { Admin } from "../../models/admin.model.js";
import type { IAdmin } from "../models/admin.interface.js";
import type { StudentProfile } from "../models/student.interface.js";
import type { MentorProfile } from "../models/mentor.interface.js";

export interface IAdminRepository {
    findByEmail(email: string): Promise<IAdmin | null>;
    create(admin: Partial<IAdmin>): Promise<IAdmin>;
    getAllStudents(): Promise<StudentProfile[]>;
    getAllMentors(): Promise<MentorProfile[]>
}