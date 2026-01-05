import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IAdminRepository } from "../interfaces/repositories/IAdminRepository";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util";
import { comparePasswords } from "../utils/password.utils";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import { logger } from "../utils/logger";
import type { MentorProfile } from "../interfaces/models/mentor.interface";
import type { IStudentRepository } from "@/interfaces/repositories/IStudentRepository";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import mongoose from "mongoose";
import type { MentorResponseDto } from "@/dto/mentor/MentorResponseDTO";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { IAdminService } from "@/interfaces/services/IAdminService";
import { AdminMapper } from "@/mappers/AdminMapper";
import { MentorMapper } from "@/mappers/MentorMapper";
import type { ICourseRepository } from "@/interfaces/repositories/ICourseRepository";
import type { IEnrollmentLinkRepository } from "@/interfaces/repositories/IEnrollmentLinkRepository";
import type {
  AdminLoginResponseDto,
  DashboardDataDto,
} from "@/dto/admin/AdminLoginResponseDTO";
import { getSignedFileUrl } from "@/utils/s3Upload";
import type { IEmailService } from "@/interfaces/services/IEmailService";
import { StudentMapper } from "@/mappers/StudentMapper";
import bcrypt from "bcryptjs";
import type { SubscriptionDetails } from "@/dto/auth/UserResponseDTO";
import { TrialClassMapper } from "@/mappers/trialClassMapper";
import { type ITrialClassDocument } from "@/models/student/trialClass.model";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type { TrialClassResponseDto } from "@/dto/student/trialClassDTO";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";
import type { MentorPaginationParams, StudentPaginationParams, PaginatedResponse } from "@/dto/shared/paginationTypes";
import { InternalEventEmitter } from "@/utils/InternalEventEmitter";
import { EVENTS } from "@/utils/InternalEventEmitter";



import type { IMentorRequestService } from "../interfaces/services/IMentorRequestService";

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepo: IAdminRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository,
    @inject(TYPES.ITrialClassRepository) private _trialClassRepo: ITrialClassRepository,
    @inject(TYPES.ISubjectRepository) private _subjectRepo: ISubjectRepository,
    @inject(TYPES.ICourseRepository) private _courseRepo: ICourseRepository,
    @inject(TYPES.IEnrollmentLinkRepository) private _enrollmentLinkRepo: IEnrollmentLinkRepository,
    @inject(TYPES.IMentorRequestService) private _mentorRequestService: IMentorRequestService,
    @inject(TYPES.IMentorAssignmentRequestRepository) private _requestRepo: import("../interfaces/repositories/IMentorAssignmentRequestRepository").IMentorAssignmentRequestRepository,
    @inject(TYPES.InternalEventEmitter) private _eventEmitter: InternalEventEmitter,
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

  async getAllMentorsPaginated(params: MentorPaginationParams): Promise<PaginatedResponse<MentorResponseDto>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;

      logger.info(`Fetching paginated mentors - page: ${page}, limit: ${limit}, search: ${params.search}, status: ${params.status}`);

      const result = await this._mentorRepo.findAllMentorsPaginated(params);

      const mentorDtos = MentorMapper.toResponseDtoList(result.mentors);
      const totalPages = Math.ceil(result.total / limit);

      logger.info(`Retrieved ${mentorDtos.length} mentors (page ${page}/${totalPages}, total: ${result.total})`);

      return {
        success: true,
        data: mentorDtos,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error fetching paginated mentors:", error);
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

  async getAllStudentsPaginated(params: StudentPaginationParams): Promise<PaginatedResponse<StudentBaseResponseDto>> {
    try {
      const page = params.page || 1;
      const limit = params.limit || 10;

      logger.info(`Fetching paginated students - page: ${page}, limit: ${limit}, search: ${params.search}, status: ${params.status}`);

      const result = await this._studentRepo.findAllStudentsPaginated(params);

      const totalPages = Math.ceil(result.total / limit);

      // Transform to StudentBaseResponseDto using mapper
      const studentDtos: StudentBaseResponseDto[] = (result.students as unknown[]).map((student: unknown) => {
        const s = student as {
            _id?: { toString(): string };
            id?: string;
            fullName: string;
            email: string;
            phoneNumber?: string;
            isVerified?: boolean;
            isProfileComplete?: boolean;
            subscription?: { status?: string; plan?: string; startDate?: Date; endDate?: Date };
            isBlocked?: boolean;
            totalTrialClasses?: number;
            pendingTrialClasses?: number;
            createdAt?: Date;
            updatedAt?: Date;
        };
        return {
        id: (s._id?.toString() || s.id || '').toString(),
        fullName: s.fullName,
        email: s.email,
        phoneNumber: s.phoneNumber || '',
        role: 'student' as const,
        isVerified: s.isVerified || false,
        isProfileComplete: s.isProfileComplete || false,
        isPaid: s.subscription?.status === 'active',
        subscription: s.subscription as SubscriptionDetails | undefined,
        isBlocked: s.isBlocked || false,
        totalTrialClasses: s.totalTrialClasses || 0,
        pendingTrialClasses: s.pendingTrialClasses || 0,
        createdAt: s.createdAt || new Date(),
        updatedAt: s.updatedAt || new Date()
      };
    });

      logger.info(`Retrieved ${studentDtos.length} students (page ${page}/${totalPages}, total: ${result.total})`);

      return {
        success: true,
        data: studentDtos,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: result.total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error fetching paginated students:", error);
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

      this._eventEmitter.emit(status === 'approved' ? EVENTS.MENTOR_APPROVED : EVENTS.MENTOR_REJECTED, {
        mentorId,
        mentorName: updatedMentor.fullName,
        email: updatedMentor.email,
        status,
        reason
      });

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
          ? "Aptus - Your Mentor Profile is Approved"
          : "Aptus - Mentor Profile Review Update";

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
            <p>Best regards,<br>The Aptus Team</p>
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
            <p>Best regards,<br>The Aptus Team</p>
          </div>
        `;

      await this._emailService.sendMail(mentor.email, subject, html);
      logger.info(`Approval email sent successfully to: ${mentor.email}`);
    } catch (emailError: unknown) {
      logger.warn(
        `Failed to send approval email to ${mentor.email}:`,
        emailError
      );
    }
  }

  async blockMentor(mentorId: string): Promise<MentorResponseDto> {
    try {
      logger.info(`Blocking mentor: ${mentorId}`);

      const blocked = await this._mentorRepo.block(mentorId);
      if (!blocked) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }

      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) {
        throw new AppError(
          "Mentor not found after blocking",
          HttpStatusCode.NOT_FOUND
        );
      }

      const mentorDto = MentorMapper.toResponseDto(mentor);

      logger.info(`Mentor blocked successfully: ${mentorId}`);
      return mentorDto;
    } catch (error) {
      logger.error(`Error blocking mentor: ${mentorId}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to block mentor",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async unblockMentor(mentorId: string): Promise<MentorResponseDto> {
    try {
      logger.info(`Unblocking mentor: ${mentorId}`);

      const unblocked = await this._mentorRepo.unblock(mentorId);
      if (!unblocked) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }

      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) {
        throw new AppError(
          "Mentor not found after unblocking",
          HttpStatusCode.NOT_FOUND
        );
      }

      const mentorDto = MentorMapper.toResponseDto(mentor);

      logger.info(`Mentor unblocked successfully: ${mentorId}`);
      return mentorDto;
    } catch (error) {
      logger.error(`Error unblocking mentor: ${mentorId}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to unblock mentor",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

 
async blockStudent(studentId: string): Promise<StudentBaseResponseDto> {
  try {
    logger.info(`Blocking student: ${studentId}`);

    const blockedStudent = await this._studentRepo.blockStudent(studentId);
    console.log("🔍 StudentRepository - Blocked student raw:", blockedStudent);
    const studentDto = StudentMapper.toStudentResponseDto(blockedStudent);
console.log("🔍 StudentRepository - Blocked student mapped:", studentDto);
    logger.info(`Student blocked successfully: ${studentId}`);
    return studentDto;
  } catch (error) {
    logger.error(`Error blocking student: ${studentId}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to block student",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

async unblockStudent(studentId: string): Promise<StudentBaseResponseDto> {
  try {
    logger.info(`Unblocking student: ${studentId}`);

    const unblockedStudent = await this._studentRepo.unblockStudent(studentId);
    console.log("🔍 StudentRepository - Unblocked student raw:", unblockedStudent);
    const studentDto = StudentMapper.toStudentResponseDto(unblockedStudent);
console.log("🔍 StudentRepository - Unblocked student mapped:", studentDto);
    logger.info(`Student unblocked successfully: ${studentId}`);
    return studentDto;
  } catch (error) {
    logger.error(`Error unblocking student: ${studentId}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to unblock student",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


// AdminService.ts - Fix the type issues in update methods
async updateMentor(mentorId: string, data: Partial<MentorProfile>): Promise<MentorResponseDto> {
  try {
    logger.info(`Updating mentor: ${mentorId}`, data);

    // Remove fields that shouldn't be updated directly
    const { _id: _i, password: _p, email: _e, createdAt: _c, updatedAt: _u, ...updateData } = data;

    const updatedMentor = await this._mentorRepo.updateById(mentorId, updateData);
    
    if (!updatedMentor) {
      throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
    }

    const mentorDto = MentorMapper.toResponseDto(updatedMentor);

    logger.info(`Mentor updated successfully: ${mentorId}`);
    return mentorDto;
  } catch (error) {
    logger.error(`Error updating mentor: ${mentorId}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to update mentor",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

async updateStudent(studentId: string, data: Partial<StudentBaseResponseDto>): Promise<StudentBaseResponseDto> {
  try {
    logger.info(`Updating student: ${studentId}`, data);

    // Use the safe mapper to handle undefined values properly
    const studentUpdateData = StudentMapper.toSafeUpdateData(data);

    const updatedStudent = await this._studentRepo.updateById(studentId, studentUpdateData);
    
    if (!updatedStudent) {
      throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
    }

    const studentDto = StudentMapper.toStudentResponseDto(updatedStudent);

    logger.info(`Student updated successfully: ${studentId}`);
    return studentDto;
  } catch (error) {
    logger.error(`Error updating student: ${studentId}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to update student",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


  async addStudent(studentData: {
    fullName: string;
    email: string;
    phoneNumber?: string;
  }): Promise<StudentBaseResponseDto> {
    try {
      logger.info(`Adding new student: ${studentData.email}`);

      const existingStudent = await this._studentRepo.findByEmail(
        studentData.email
      );
      if (existingStudent) {
        throw new AppError(
          "Student with this email already exists",
          HttpStatusCode.CONFLICT
        );
      }

      const temporaryPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

      const studentAuthData = {
        fullName: studentData.fullName,
        email: studentData.email,
        phoneNumber: studentData.phoneNumber || "",
        password: hashedPassword,
        role: "student" as const,
        isVerified: true,
        isProfileComplete: false,
        approvalStatus: "approved" as const,
        isBlocked: false,
        isPaid: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newStudent = await this._studentRepo.create(studentAuthData);


      const studentDto = StudentMapper.toStudentResponseDto(newStudent);

      logger.info(`Student added successfully: ${studentData.email}`);
      return studentDto;
    } catch (error) {
      logger.error(`Error adding student: ${studentData.email}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to add student",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }


  async addMentor(mentorData: {
  fullName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  bio?: string;
}): Promise<MentorResponseDto> {
  try {
    logger.info(`Adding new mentor: ${mentorData.email}`);


    const existingMentor = await this._mentorRepo.findByEmail(mentorData.email);
    if (existingMentor) {
      throw new AppError("Mentor with this email already exists", HttpStatusCode.CONFLICT);
    }

    
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

    
    const mentorAuthData = {
      fullName: mentorData.fullName,
      email: mentorData.email,
      phoneNumber: mentorData.phoneNumber || "",
      password: hashedPassword,
      role: "mentor" as const,
      location: mentorData.location || "",
      bio: mentorData.bio || "",
      academicQualifications: [],
      experiences: [],
      subjectProficiency: [],
      certification: [],
      isVerified: true,
      isBlocked: false,
      isProfileComplete: false,
      approvalStatus: "approved" as any,
      authProvider: "local" as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    
    const newMentor = await this._mentorRepo.create(mentorAuthData);
    
    if (!newMentor) {
      throw new AppError("Failed to create mentor", HttpStatusCode.INTERNAL_SERVER_ERROR);
    }

    const mentorDto = MentorMapper.toResponseDto(newMentor);
    
    logger.info(`Mentor added successfully: ${mentorData.email}`);
    return mentorDto;
  } catch (error) {
    logger.error(`Error adding mentor: ${mentorData.email}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to add mentor",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


async getStudentsWithTrialStats(page: number, limit: number) {
    try {
      logger.info(`AdminService: Fetching students with trial stats - Page: ${page}, Limit: ${limit}`);

      const result = await this._studentRepo.findAllWithTrialStats(page, limit);

      logger.info(`AdminService: Successfully fetched ${result.students.length} students with trial stats`);

      return {
        success: true,
        data: {
          students: result.students,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(result.totalStudents / limit),
            totalStudents: result.totalStudents,
            hasNextPage: page < Math.ceil(result.totalStudents / limit),
            hasPrevPage: page > 1
          }
        }
      };
    } catch (error) {
      logger.error("AdminService: Error fetching students with trial stats", error);
      throw error; 
    }
  }


// AdminService.ts - Fix the getStudentTrialClasses method
async getStudentTrialClasses(studentId: string, status?: string): Promise<TrialClassResponseDto[]> {
  try {
    logger.info(`AdminService: Fetching trial classes for student - ${studentId}`, { status });

    // Validate student exists
    // const student = await this._studentRepo.findById(studentId);
    // if (!student) {
    //   throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
    // }

    const trialClasses = await this._trialClassRepo.findByStudentId(studentId, status);
    
    // Use the mapper to transform the data
    const trialClassesDto = trialClasses.map(trialClass => 
      TrialClassMapper.toResponseDto(trialClass)
    );

    logger.info(`AdminService: Successfully fetched ${trialClassesDto.length} trial classes for student ${studentId}`);
    
    return trialClassesDto;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`AdminService: Error fetching trial classes for student ${studentId}`, error);
    throw new AppError(
      "Failed to fetch student trial classes",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}



  async assignMentorToTrialClass(
    trialClassId: string,
    mentorId: string,
    scheduledDate: string,
    scheduledTime: string,

  ) {
    try {
      logger.info(`AdminService: Assigning mentor to trial class - ${trialClassId}`, {
        mentorId,
        scheduledDate,
        scheduledTime,
      });

      // Check if mentor exists using mentor repository
      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) {
        logger.warn(`AdminService: Mentor not found - ${mentorId}`);
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }


      // Auto-generate meet link for the trial class
      const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const meetLink = `${baseUrl}/trial-class/${trialClassId}/call`;

      const updates: Partial<ITrialClassDocument> = {
        preferredDate: new Date(scheduledDate),
        preferredTime: scheduledTime,
        meetLink,
      };

      const updatedTrialClass = await this._trialClassRepo.assignMentor(
        trialClassId, 
        mentorId, 
        updates
      );

      if (!updatedTrialClass) {
        throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      }

      const trialClassDto = TrialClassMapper.toResponseDto(updatedTrialClass);

      this._eventEmitter.emit(EVENTS.TRIAL_MENTOR_ASSIGNED, {
        trialClassId,
        studentId: (updatedTrialClass as any).studentId?.toString(),
        mentorId,
        mentorName: mentor.fullName,
        subjectName: (updatedTrialClass as any).subjectId?.subjectName || "Subject",
        scheduledDate,
        scheduledTime,
        meetLink
      });

      logger.info(`AdminService: Successfully assigned mentor to trial class ${trialClassId} with meet link: ${meetLink}`);
      
      return trialClassDto;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`AdminService: Error assigning mentor to trial class ${trialClassId}`, error);
      throw new AppError(
        "Failed to assign mentor to trial class",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateTrialClassStatus(trialClassId: string, status: string, reason?: string) {
    try {
      logger.info(`AdminService: Updating trial class status - ${trialClassId}`, { status, reason });

      const updatedTrialClass = await this._trialClassRepo.updateStatus(trialClassId, status, reason);

      if (!updatedTrialClass) {
        logger.warn(`AdminService: Trial class not found - ${trialClassId}`);
        throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      }

      const trialClassDto = TrialClassMapper.toResponseDto(updatedTrialClass);

      logger.info(`AdminService: Successfully updated trial class status for ${trialClassId}`);
      
      return trialClassDto;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`AdminService: Error updating trial class status ${trialClassId}`, error);
      throw new AppError(
        "Failed to update trial class status",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getAllTrialClasses(filters: { status?: string; page?: number; limit?: number }): Promise<{ trialClasses: TrialClassResponseDto[]; pagination: { currentPage: number; totalPages: number; totalTrialClasses: number; hasNextPage: boolean; hasPrevPage: boolean; }; }> {
  try {
    const { status, page = 1, limit = 10 } = filters;

    logger.info("AdminService: Fetching all trial classes", { status, page, limit });

    // Create a clean filters object that handles undefined properly
    const cleanFilters: { status?: string; page?: number; limit?: number } = {
      page,
      limit
    };

    // Only add status if it's defined and not empty
    if (status && status.trim() !== '') {
      cleanFilters.status = status;
    }

    const result = await this._trialClassRepo.findAll(cleanFilters);
    
    const trialClassesDto = result.trialClasses.map(trialClass => 
      TrialClassMapper.toResponseDto(trialClass)
    );

    const response = {
      trialClasses: trialClassesDto,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        totalTrialClasses: result.total,
        hasNextPage: page < Math.ceil(result.total / limit),
        hasPrevPage: page > 1,
      },
    };

    logger.info(`AdminService: Successfully fetched ${trialClassesDto.length} trial classes`);
    
    return response;
  } catch (error) {
    logger.error("AdminService: Error fetching all trial classes", error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to fetch trial classes",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
  }


  
async getTrialClassDetails(trialClassId: string): Promise<TrialClassResponseDto> {
  try {
    logger.info(`AdminService: Fetching trial class details - ${trialClassId}`);

    // Validate trialClassId
    if (!trialClassId || trialClassId.trim() === '') {
      throw new AppError("Trial class ID is required", HttpStatusCode.BAD_REQUEST);
    }

    const trialClass = await this._trialClassRepo.findById(trialClassId);

    if (!trialClass) {
      logger.warn(`AdminService: Trial class not found - ${trialClassId}`);
      throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
    }

    // Use the mapper to transform the data
    const trialClassDto = TrialClassMapper.toResponseDto(trialClass);

    logger.info(`AdminService: Successfully fetched trial class details for ${trialClassId}`);
    
    return trialClassDto;
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error(`AdminService: Error fetching trial class details ${trialClassId}`, error);
    throw new AppError(
      "Failed to fetch trial class details",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

// In your AdminService - fix the findBySubjectProficiency method
  // AdminService.ts - Updated logic for matches/alternates
  async getAvailableMentors(
    subjectId: string, 
    preferredDate?: string,
    days?: string[],
    timeSlot?: string
  ): Promise<{ matches: MentorResponseDto[], alternates: MentorResponseDto[] }> {
    try {
      logger.info(`AdminService: Fetching available mentors for subject ${subjectId}`, { preferredDate, days, timeSlot });

      let subjectName = subjectId;

      // Check if subjectId is a valid ObjectId before trying to findById
      const isValidId = /^[0-9a-fA-F]{24}$/.test(subjectId);

      if (isValidId) {
        const subject = await this._subjectRepo.findById(subjectId);
        if (subject) {
          subjectName = subject.subjectName;
        } else {
           // If ID is valid format but not found, maybe it's just a funny name? 
           // Or strictly throw error? 
           // For now, if lookup fails but ID was valid format, it's safer to throw or log.
           // But let's assume if it fails, we fall back to using it as a name? 
           // No, best to just log.
           logger.warn(`Subject with ID ${subjectId} not found, assuming it is a name.`);
        }
      }

      console.log('🔍 Looking for mentors with subject:', subjectName);

      // Find mentors who have this subject in their subjectProficiency
      // This returns all mentors who teach the subject, regardless of time
      const allMentors = await this._mentorRepo.findBySubjectProficiency(
        subjectName
      );

      console.log('🔍 Found total mentors for subject:', allMentors.length);

      const matches: MentorResponseDto[] = [];
      const alternates: MentorResponseDto[] = [];

      // Helper to check time overlap
      const checkAvailability = (mentor: MentorProfile): boolean => {
        // If no constraints provided, everyone is a match
        if ((!days || days.length === 0) && !timeSlot && !preferredDate) return true;

        if (!mentor.availability || mentor.availability.length === 0) return false;

        // Normalize requested days
        const requestedDays = days ? days.map(d => d.toLowerCase()) : [];
        if (preferredDate) {
          const dayName = new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          if (!requestedDays.includes(dayName)) requestedDays.push(dayName);
        }

        // Check if mentor has availability on ALL requested days
        // (Or at least ONE? Usually strict means ALL for a course schedule)
        // Let's assume strict: Must be available on all requested days at the requested time.
        
        // 1. Check Day Availability
        const mentorAvailableDays = mentor.availability.map(a => a.day.toLowerCase());
        const daysMatch = requestedDays.every(day => mentorAvailableDays.includes(day));
        
        if (!daysMatch) return false;

        if (timeSlot) {
           // Parse requested time "19:30-20:30"
           const parts = timeSlot.split('-').map(t => t.trim());
           if (parts.length === 2) {
             const reqStart = parts[0] || "";
             const reqEnd = parts[1] || "";
             
             // For each requested day, check if they have a slot containing this time
             for (const day of requestedDays) {
                const daySlots = mentor.availability?.find(a => a.day.toLowerCase() === day)?.slots || [];
                
                const hasSlot = daySlots.some(slot => {
                   return (slot.startTime <= reqStart) && (slot.endTime >= reqEnd);
                });
  
                if (!hasSlot) return false; 
             }
           }
        }
        
        return true;
      };

      for (const mentor of allMentors) {
        const dto = MentorMapper.toResponseDto(mentor);
        
        if (checkAvailability(mentor)) {
          matches.push(dto);
        } else {
          alternates.push(dto);
        }
      }

      logger.info(`AdminService: Matches: ${matches.length}, Alternates: ${alternates.length}`);
      
      return { matches, alternates };
    } catch (error) {
      logger.error(`AdminService: Error fetching available mentors for subject ${subjectId}`, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        "Failed to fetch available mentors",
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }




  async assignMentor(
    studentId: string, 
    subjectId: string, 
    mentorId: string, 
    adminId?: string,
    overrides?: {
      days?: string[];
      timeSlot?: string;
    }
  ): Promise<void> {
    try {
      logger.info(`AdminService: Assigning mentor ${mentorId} to student ${studentId} for subject ${subjectId}. Overrides: ${JSON.stringify(overrides)}`);

      // 1. Find or Create MentorAssignmentRequest
      // We check for any pending request first
      let request = await this._requestRepo.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        subjectId: new mongoose.Types.ObjectId(subjectId),
        status: 'pending'
      });

      if (!request) {
        logger.info(`AdminService: No pending request found. Creating a new one for assignment tracking.`);
        // Note: studentId, subjectId, mentorId are enough to create a request
        request = await this._requestRepo.create({
          studentId: new mongoose.Types.ObjectId(studentId),
          subjectId: new mongoose.Types.ObjectId(subjectId),
          mentorId: new mongoose.Types.ObjectId(mentorId),
          status: 'pending' // Create as pending so approveRequest can process it
        });
      }

      // 2. Delegate to MentorRequestService.approveRequest
      // This will handle:
      // - Idempotency (won't error if course exists)
      // - Creation of Course, EnrollmentLink, Sessions
      // - Status updates for Request and Student Preferences
      // - Notifications
      const requestAny = request as any;
      await this._mentorRequestService.approveRequest(
        requestAny._id.toString(),
        adminId || "system", // Use system if adminId not provided
        {
          mentorId,
          days: overrides?.days,
          timeSlot: overrides?.timeSlot
        }
      );

      logger.info(`AdminService: Successfully delegated assignment to MentorRequestService for students ${studentId}`);

    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`AdminService: Error assigning mentor:`, error);
      throw new AppError(
        `Failed to assign mentor: ${error instanceof Error ? error.message : "Unknown error"}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async reassignMentor(
    studentId: string, 
    subjectId: string, 
    newMentorId: string,
    adminId?: string,
    overrides?: {
      days?: string[];
      timeSlot?: string;
    }
  ): Promise<void> {
    try {
      logger.info(`AdminService: Reassigning student ${studentId} to new mentor ${newMentorId} for subject ${subjectId}. Overrides: ${JSON.stringify(overrides)}`);
      
      // 1. Find or Create MentorAssignmentRequest
      // Check for any existing request for this subject (pending or approved)
      let request = await this._requestRepo.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        subjectId: new mongoose.Types.ObjectId(subjectId)
      });

      if (!request) {
        logger.info(`AdminService: No existing request found for reassignment. Creating a new one.`);
        request = await this._requestRepo.create({
          studentId: new mongoose.Types.ObjectId(studentId),
          subjectId: new mongoose.Types.ObjectId(subjectId),
          mentorId: new mongoose.Types.ObjectId(newMentorId),
          status: 'approved' // Create as approved since it's an active reassignment
        });
      }

      // 2. Delegate to MentorRequestService.approveRequest
      // This will handle the course update and session recovery/regeneration
      await this._mentorRequestService.approveRequest(
        (request as any)._id.toString(),
        adminId || "system",
        {
          mentorId: newMentorId,
          days: overrides?.days,
          timeSlot: overrides?.timeSlot
        }
      );

      logger.info(`AdminService: Successfully delegated reassignment to MentorRequestService for student ${studentId}`);

    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(`AdminService: Error reassigning mentor`, error);
      throw new AppError(
        `Failed to reassign mentor: ${error instanceof Error ? error.message : "Unknown error"}`, 
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }
}