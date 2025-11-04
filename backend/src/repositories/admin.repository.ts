import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository";
import { Admin } from "../models/admin.model";
import { StudentModel } from "../models/student.model";
import { MentorModel } from "../models/mentor.model";
import type { IAdmin } from "../interfaces/models/admin.interface";

export class AdminRepository implements IAdminRepository {
  async findByEmail(email: string): Promise<IAdmin | null> {
    return Admin.findOne({ email });
  }

  async create(admin: Partial<IAdmin>): Promise<IAdmin> {
    return Admin.create(admin);
  }
  async getAllStudents() {
    return await StudentModel.find({}, "fullName email createdAt");
  }

  async getAllMentors() {
    return await MentorModel.find(
      {},
      "fullName email createdAt approvalStatus"
    );
  }
}
