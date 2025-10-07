import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import { comparePasswords } from "../utils/password.utils.js";
import type { IAdmin } from "../interfaces/models/admin.interface.js";

export class AdminService {
  constructor(private _adminRepository: IAdminRepository) {}

  async login(email: string, password: string): Promise<{
    admin: IAdmin;
    accessToken: string;
    refreshToken: string;
  }> {
    const admin = await this._adminRepository.findByEmail(email);

    if (!admin) throw new Error("Invalid credentials");

    const isPasswordValid = await comparePasswords(password, admin.password);
    if (!isPasswordValid) throw new Error("Invalid credentials");

    const accessToken = generateAccessToken({
      id: admin._id.toString(),
      role: "admin",
      email: admin.email,
    });

    const refreshToken = generateRefreshToken({
      id: admin._id.toString(),
      role: "admin",
      email: admin.email,
    });

    
    const adminData = admin.toObject();
    delete (adminData as any).password;

    return { admin: adminData, accessToken, refreshToken };
  }


  async getDashboardData() {
    const [students, mentors] = await Promise.all([
      this._adminRepository.getAllStudents(),
      this._adminRepository.getAllMentors(),
    ]);

    return {
      totalStudents: students.length,
      totalMentors: mentors.length,
      recentStudents: students.slice(-5),
      recentMentors: mentors.slice(-5),
    };
  }
}
