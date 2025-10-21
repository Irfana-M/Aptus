import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository.js";
import { Admin } from "../models/admin.model.js";
import { StudentModel } from "../models/student.model.js";
import { MentorModel } from "../models/mentor.model.js";
import type { IAdmin } from "../interfaces/models/admin.interface.js";

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
    return await MentorModel.find({}, "fullName email createdAt approvalStatus");
  }
}