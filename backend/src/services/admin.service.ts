import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";
import { comparePasswords } from "../utils/password.utils.js";
import type { IAdmin } from "../interfaces/models/admin.interface.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import { NodemailerService } from "./email.service.js";
import { logger } from "../utils/logger.js";
import type { MentorProfile } from "../interfaces/models/mentor.interface.js";

export class AdminService {
  constructor(private _adminRepository: IAdminRepository,
    private _mentorRepo: IMentorRepository,
    private _emailService: NodemailerService
  ) {}

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




async fetchMentorProfile(mentorId: string) {
    return this._mentorRepo.findById(mentorId);
  }

async updateMentorApprovalStatus(
  mentorId: string,
  status: "approved" | "rejected",
  adminId: string,
  reason?: string
): Promise<MentorProfile | null> {
  try {
    logger.info(`Updating mentor - Mentor: ${mentorId}, Admin: ${adminId}, Status: ${status}`);

    const updatedMentor = await this._mentorRepo.updateApprovalStatus(mentorId, status, reason);
    if (!updatedMentor) {
      logger.error(`Mentor not found: ${mentorId}`);
      throw new Error("Mentor not found");
    }

    // Email content
    const subject = status === "approved"
      ? "Mentora - Your Mentor Profile is Approved"
      : "Mentora - Mentor Profile Review Update";

    const text = status === "approved"
      ? `<p>Hi ${updatedMentor.fullName},</p>
         <p>Congratulations — your mentor profile has been approved by our admin team.</p>
         <p>You can now access all mentor features and start helping students.</p>`
      : `<p>Hi ${updatedMentor.fullName},</p>
         <p>After careful consideration, we are unable to approve your profile at this time.</p>
         <p><strong>Reason:</strong> ${reason}</p>
         <p>Please review your profile, make updates, and resubmit for approval.</p>`;

    try {
      await this._emailService.sendMail(updatedMentor.email, subject, text);
      logger.info(`Email sent successfully to: ${updatedMentor.email}`);
    } catch (emailError: any) {
      logger.warn(`Failed to send email to ${updatedMentor.email}: ${emailError.message}`);
    }

    return updatedMentor;

  } catch (error: any) {
    logger.error(`Error updating mentor ${mentorId}: ${error.message}`, { error: error.stack });
    throw error;
  }
}

    }