import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository";
import { Admin } from "../models/admin/admin.model";
import { StudentModel } from "../models/student/student.model";
import { MentorModel } from "../models/mentor/mentor.model";
import type { IAdmin } from "../interfaces/models/admin.interface";
import { BaseRepository } from "./baseRepository";
import { injectable } from "inversify";

@injectable()
export class AdminRepository extends BaseRepository<IAdmin> implements IAdminRepository {
  constructor() {
    super(Admin);
  }

  async findByEmail(email: string): Promise<IAdmin | null> {
    return await this.findOne({ email });
  }

}