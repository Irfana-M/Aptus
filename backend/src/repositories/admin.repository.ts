import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository.js";
import { Admin } from "../models/admin/admin.model.js";

import type { IAdmin } from "../interfaces/models/admin.interface.js";
import { BaseRepository } from "./baseRepository.js";
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