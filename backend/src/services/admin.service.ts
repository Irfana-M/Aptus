import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";
import { comparePasswords } from "../utils/password.utils";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import { NodemailerService } from "./email.service";
import { logger } from "../utils/logger";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import type { IStudentRepository } from "@/interfaces/repositories/IStudentRepository";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import type { MentorResponseDto } from "@/dto/mentor/MentorResponseDTO";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { IAdminService } from "@/interfaces/services/IAdminService";
import { AdminMapper } from "@/mappers/AdminMapper";
import { MentorMapper } from "@/mappers/MentorMapper";
import type {
  AdminLoginResponseDto,
  DashboardDataDto,
} from "@/dto/admin/AdminLoginResponseDTO";
import { getSignedFileUrl } from "@/utils/s3Upload";
import type { IEmailService } from "@/interfaces/services/IEmailService";

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepo: IAdminRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository
  ) {}

  async login(email: string, password: string): Promise<AdminLoginResponseDto> {
    try {
      const admin = await this._adminRepo.findByEmail(email);

      if (!admin) {
        throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED);
      }

      const isPasswordValid = await comparePasswords(password, admin.password);
      if (!isPasswordValid) {
        throw new AppError("Invalid credentials", HttpStatusCode.UNAUTHORIZED);
      }

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

      return AdminMapper.toLoginResponseDto(admin, accessToken, refreshToken);
    } catch (error) {
      logger.error("Admin login error:", error);
      if (error instanceof AppError) throw error;
      throw new AppError("Login failed", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  async getDashboardData(): Promise<DashboardDataDto> {
    try {
      const [students, mentors] = await Promise.all([
        this._studentRepo.findAllStudents(),
        this._mentorRepo.getAllMentors(),
      ]);

      const recentStudents = students.slice(-5).reverse();
      const recentMentors = MentorMapper.toResponseDtoList(
        mentors.slice(-5).reverse()
      );

      logger.info("Dashboard data fetched", {
        totalStudents: students.length,
        totalMentors: mentors.length,
        recentStudents: recentStudents.length,
        recentMentors: recentMentors.length,
      });

      return {
        totalStudents: students.length,
        totalMentors: mentors.length,
        recentStudents,
        recentMentors,
      };
    } catch (error) {
      logger.error("Error fetching dashboard data:", error);
      throw new AppError(
        "Failed to fetch dashboard data",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllMentors(): Promise<MentorResponseDto[]> {
    try {
      const mentors = await this._mentorRepo.getAllMentors();
      logger.info(`Retrieved ${mentors.length} mentors`);

      return MentorMapper.toResponseDtoList(mentors);
    } catch (error) {
      logger.error("Error fetching all mentors:", error);
      throw new AppError(
        "Failed to fetch mentors",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllStudents(): Promise<StudentBaseResponseDto[]> {
    try {
      const students = await this._studentRepo.findAllStudents();
      logger.info(`Retrieved ${students.length} students`);
      return students;
    } catch (error) {
      logger.error("Error fetching all students:", error);
      throw new AppError(
        "Failed to fetch students",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async fetchMentorProfile(mentorId: string): Promise<MentorResponseDto> {
    try {
      const mentor = await this._mentorRepo.findById(mentorId);

      if (!mentor) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }

      console.log("🔍 Backend - Mentor found:", {
        id: mentor._id,
        profileImageKey: mentor.profileImageKey,
        profilePicture: mentor.profilePicture,
      });

      if (mentor.profilePicture) {
        console.log(
          "🔍 Backend - Generating signed URL for key:",
          mentor.profilePicture
        );
        mentor.profileImageUrl = await getSignedFileUrl(mentor.profilePicture);
        console.log(
          "🔍 Backend - Generated signed URL:",
          mentor.profileImageUrl
        );
      } else {
        console.log("🔍 Backend - No profile picture found");
      }

      logger.info(`Fetched mentor profile: ${mentorId}`);

      return MentorMapper.toResponseDto(mentor);
    } catch (error) {
      logger.error(`Error fetching mentor profile ${mentorId}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to fetch mentor profile",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateMentorApprovalStatus(
    mentorId: string,
    status: "approved" | "rejected",
    adminId: string,
    reason?: string
  ): Promise<MentorResponseDto> {
    try {
      logger.info(`Updating mentor approval status`, {
        mentorId,
        adminId,
        status,
        reason,
      });

      if (status === "rejected" && (!reason || reason.trim().length === 0)) {
        throw new AppError(
          "Reason is required when rejecting a mentor",
          HttpStatusCode.BAD_REQUEST
        );
      }

      const updatedMentor = await this._mentorRepo.updateApprovalStatus(
        mentorId,
        status,
        reason
      );

      if (!updatedMentor) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }

      await this.sendApprovalEmail(updatedMentor, status, reason);

      logger.info(`Mentor approval status updated successfully`, {
        mentorId,
        status,
        email: updatedMentor.email,
      });

      return MentorMapper.toResponseDto(updatedMentor);
    } catch (error) {
      logger.error(`Error updating mentor approval status ${mentorId}:`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to update mentor approval status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  private async sendApprovalEmail(
    mentor: MentorProfile,
    status: "approved" | "rejected",
    reason?: string
  ): Promise<void> {
    try {
      const subject =
        status === "approved"
          ? "Mentora - Your Mentor Profile is Approved"
          : "Mentora - Mentor Profile Review Update";

      const html =
        status === "approved"
          ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Profile Approved! 🎉</h2>
            <p>Hi <strong>${mentor.fullName}</strong>,</p>
            <p>Congratulations — your mentor profile has been approved by our admin team!</p>
            <p>You can now access all mentor features and start helping students on our platform.</p>
            <p>We're excited to have you as part of our mentoring community!</p>
            <br>
            <p>Best regards,<br>The Mentora Team</p>
          </div>
        `
          : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #EF4444;">Profile Update Required</h2>
            <p>Hi <strong>${mentor.fullName}</strong>,</p>
            <p>After careful consideration, we are unable to approve your mentor profile at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>Please review your profile information, make the necessary updates, and resubmit for approval.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <br>
            <p>Best regards,<br>The Mentora Team</p>
          </div>
        `;

      await this._emailService.sendMail(mentor.email, subject, html);
      logger.info(`Approval email sent successfully to: ${mentor.email}`);
    } catch (emailError: any) {
      logger.warn(
        `Failed to send approval email to ${mentor.email}:`,
        emailError
      );
    }
  }
}
