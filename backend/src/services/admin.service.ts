import { injectable, inject } from "inversify";
import { Types } from "mongoose";
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
import type { MentorResponseDto } from "@/dtos/mentor/MentorResponseDTO";
import type { StudentBaseResponseDto } from "@/dtos/auth/UserResponseDTO";
import type { IAdminService } from "@/interfaces/services/IAdminService";
import { AdminMapper } from "@/mappers/AdminMapper";
import { MentorMapper } from "@/mappers/MentorMapper";
import type { ICourseRepository } from "@/interfaces/repositories/ICourseRepository";
import type { IEnrollmentLinkRepository } from "@/interfaces/repositories/IEnrollmentLinkRepository";
import type {
  AdminLoginResponseDto,
  DashboardDataDto,
} from "@/dtos/admin/AdminLoginResponseDTO";
import { getSignedFileUrl } from "@/utils/s3Upload";
import type { IEmailService } from "@/interfaces/services/IEmailService";
import { StudentMapper } from "@/mappers/StudentMapper";
import bcrypt from "bcryptjs";
import type { SubscriptionDetails } from "@/dtos/auth/UserResponseDTO";
import { TrialClassMapper } from "@/mappers/trialClassMapper";
import { type ITrialClassDocument } from "@/models/student/trialClass.model";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type { TrialClassResponseDto } from "@/dtos/student/trialClassDTO";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";
import type { MentorPaginationParams, StudentPaginationParams, PaginatedResponse } from "@/dtos/shared/paginationTypes";
import { formatPaginatedResult } from "@/utils/pagination.util";
import { InternalEventEmitter } from "@/utils/InternalEventEmitter";
import { EVENTS } from "@/utils/InternalEventEmitter";
import { normalizeTimeTo24h, isSlotMatching } from "../utils/time.util";
import { ApprovalStatus } from "@/domain/enums/ApprovalStatus";
import type { IPaymentRepository } from "@/interfaces/repositories/IPaymentRepository";
import type { FinanceDashboardDataDto } from "@/dtos/admin/AdminLoginResponseDTO";



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
    @inject(TYPES.ISessionRepository) private _sessionRepo: import("../interfaces/repositories/ISessionRepository").ISessionRepository,
    @inject(TYPES.ITimeSlotRepository) private _timeSlotRepo: import("../interfaces/repositories/ITimeSlotRepository").ITimeSlotRepository,
    @inject(TYPES.INotificationService) private _notificationService: import("../interfaces/services/INotificationService").INotificationService,
    @inject(TYPES.IPaymentRepository) private _paymentRepo: IPaymentRepository,
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
        id: (admin._id as unknown as string).toString(),
        role: "admin",
        email: admin.email,
      });

      const refreshToken = generateRefreshToken({
        id: (admin._id as unknown as string).toString(),
        role: "admin",
        email: admin.email,
      });

      return AdminMapper.toLoginResponseDto(admin, accessToken, refreshToken);
    } catch (error: unknown) {
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

      const financeStats = await this.getFinanceStats().catch(err => {
        logger.error("Error fetching finance stats for dashboard:", err);
        return undefined;
      });

      return {
        totalStudents: students.length,
        totalMentors: mentors.length,
        recentStudents,
        recentMentors,
        finance: financeStats,
      };
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

      logger.info(`Retrieved ${mentorDtos.length} mentors (total: ${result.total})`);

      return formatPaginatedResult(mentorDtos, result.total, { page, limit });
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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

      const studentsRaw = result.students as unknown as Array<{
        _id?: { toString(): string };
        id?: string;
        fullName: string;
        email: string;
        phoneNumber?: string;
        isVerified?: boolean;
        isProfileComplete?: boolean;
        subscription?: { status: string };
        isBlocked?: boolean;
        isTrialCompleted?: boolean;
        totalTrialClasses?: number;
        pendingTrialClasses?: number;
        createdAt?: Date;
        updatedAt?: Date;
      }>;

      const studentDtos: StudentBaseResponseDto[] = studentsRaw.map((s) => ({
        id: (s._id as unknown as string || s.id || '').toString(),
        fullName: s.fullName,
        email: s.email,
        phoneNumber: s.phoneNumber || '',
        role: 'student' as const,
        isVerified: s.isVerified || false,
        isProfileComplete: s.isProfileComplete || false,
        isPaid: s.subscription?.status === 'active',
        subscription: s.subscription as SubscriptionDetails | undefined,
        isBlocked: s.isBlocked || false,
        isTrialCompleted: s.isTrialCompleted || false,
        totalTrialClasses: s.totalTrialClasses || 0,
        pendingTrialClasses: s.pendingTrialClasses || 0,
        createdAt: s.createdAt || new Date(),
        updatedAt: s.updatedAt || new Date()
      }));

      logger.info(`Retrieved ${studentDtos.length} students (total: ${result.total})`);

      return formatPaginatedResult(studentDtos, result.total, { page, limit });
    } catch (error: unknown) {
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

      if (mentor.profilePicture) {
        mentor.profileImageUrl = await getSignedFileUrl(mentor.profilePicture);
      }

      logger.info(`Fetched mentor profile: ${mentorId}`);

      return MentorMapper.toResponseDto(mentor);
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    } catch (error: unknown) {
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
    const studentDto = StudentMapper.toStudentResponseDto(blockedStudent);
    logger.info(`Student blocked successfully: ${studentId}`);
    return studentDto;
  } catch (error: unknown) {
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
    const studentDto = StudentMapper.toStudentResponseDto(unblockedStudent);
    logger.info(`Student unblocked successfully: ${studentId}`);
    return studentDto;
  } catch (error: unknown) {
    logger.error(`Error unblocking student: ${studentId}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to unblock student",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}


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
    } catch (error: unknown) {
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
      approvalStatus: ApprovalStatus.APPROVED,
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
          students: (result.students as unknown as import('../interfaces/models/student.interface').StudentProfile[]).map(s => {
            const authUser = { ...s, role: 'student' as const } as unknown as import('../interfaces/auth/auth.interface').StudentAuthUser;
            return StudentMapper.toStudentResponseDto(authUser);
          }),
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(result.totalStudents / limit),
            totalStudents: result.totalStudents,
            hasNextPage: page < Math.ceil(result.totalStudents / limit),
            hasPrevPage: page > 1
          }
        }
      };
    } catch (error: unknown) {
      logger.error("AdminService: Error fetching students with trial stats", error);
      throw error; 
    }
  }


async getStudentTrialClasses(studentId: string, status?: string): Promise<TrialClassResponseDto[]> {
  try {
    logger.info(`AdminService: Fetching trial classes for student - ${studentId}`, { status });

    const trialClasses = await this._trialClassRepo.findByStudentId(studentId, status);
    
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

      const mentor = await this._mentorRepo.findById(mentorId);
      if (!mentor) {
        throw new AppError("Mentor not found", HttpStatusCode.NOT_FOUND);
      }

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
        updates as any
      );

      if (!updatedTrialClass) {
        throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      }

      const trialClassDto = TrialClassMapper.toResponseDto(updatedTrialClass);

      this._eventEmitter.emit(EVENTS.TRIAL_MENTOR_ASSIGNED, {
        trialClassId,
        studentId: (updatedTrialClass as any).student?.toString() as string,
        mentorId,
        mentorName: mentor.fullName,
        subjectName: (updatedTrialClass.subject as any).subjectName || "Subject",
        scheduledDate,
        scheduledTime,
        meetLink
      });

      // Send Notification to Student and Mentor
      const studentId = (updatedTrialClass.student as any)._id?.toString() || (updatedTrialClass.student as any).toString();
      const studentName = (updatedTrialClass.student as any).fullName || "Student";
      const subjectName = (updatedTrialClass.subject as any).subjectName || "Subject";

      await this._notificationService.notifyMentorAssigned(
          studentId,
          studentName,
          mentorId,
          mentor.fullName,
          subjectName
      );

      logger.info(`AdminService: Successfully assigned mentor to trial class ${trialClassId} with meet link: ${meetLink}`);
      
      return trialClassDto;
    } catch (error: unknown) {
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
        throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
      }

      const trialClassDto = TrialClassMapper.toResponseDto(updatedTrialClass);

      logger.info(`AdminService: Successfully updated trial class status for ${trialClassId}`);
      
      return trialClassDto;
    } catch (error: unknown) {
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

    const cleanFilters: { status?: string; page?: number; limit?: number } = {
      page,
      limit
    };

    if (status && status.trim() !== '') {
      cleanFilters.status = status;
    }

    const result = await this._trialClassRepo.findAllPaginated(cleanFilters);
    
    const trialClassesDto = result.trialClasses.map(trialClass => 
      TrialClassMapper.toResponseDto(trialClass)
    );

    logger.info(`AdminService: Successfully fetched ${trialClassesDto.length} trial classes`);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return formatPaginatedResult(trialClassesDto, result.total, { page, limit }) as any;
  } catch (error: unknown) {
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

    if (!trialClassId || trialClassId.trim() === '') {
      throw new AppError("Trial class ID is required", HttpStatusCode.BAD_REQUEST);
    }

    const trialClass = await this._trialClassRepo.findById(trialClassId);

    if (!trialClass) {
      throw new AppError("Trial class not found", HttpStatusCode.NOT_FOUND);
    }

    const trialClassDto = TrialClassMapper.toResponseDto(trialClass);

    logger.info(`AdminService: Successfully fetched trial class details for ${trialClassId}`);
    
    return trialClassDto;
  } catch (error: unknown) {
    if (error instanceof AppError) throw error;
    logger.error(`AdminService: Error fetching trial class details ${trialClassId}`, error);
    throw new AppError(
      "Failed to fetch trial class details",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

  async getAvailableMentors(
    subjectId: string, 
    preferredDate?: string,
    days?: string[],
    timeSlot?: string
  ): Promise<{ matches: MentorResponseDto[], alternates: MentorResponseDto[] }> {
    try {
      logger.info(`AdminService: Fetching available mentors for subject ${subjectId}`, { preferredDate, days, timeSlot });

      let subjectName = subjectId;
      try {
        if (/^[0-9a-fA-F]{24}$/.test(subjectId)) {
          const subject = await this._subjectRepo.findById(subjectId);
          if (subject) subjectName = subject.subjectName;
        }
      } catch (_err) {
        logger.debug(`AdminService: Could not resolve subject name for ${subjectId}, passing as-is`);
      }

      const allMentors = await this._mentorRepo.findBySubjectProficiency(subjectName);

      const matches: MentorResponseDto[] = [];
      const alternates: MentorResponseDto[] = [];

      const checkAvailability = (mentor: MentorProfile): boolean => {
        if ((!days || days.length === 0) && !timeSlot && !preferredDate) return true;
        if (!mentor.availability || mentor.availability.length === 0) return false;

        const requestedDays = days ? days.map(d => d.toLowerCase()) : [];
        if (preferredDate) {
          const dayName = new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          if (!requestedDays.includes(dayName)) requestedDays.push(dayName);
        }

        const mentorAvailableDays = mentor.availability.map(a => a.day.toLowerCase());
        const daysMatch = requestedDays.every(day => mentorAvailableDays.includes(day));
        
        if (!daysMatch) return false;

        if (timeSlot) {
          const [reqStart, reqEnd] = timeSlot.split('-').map(t => t.trim());

          for (const day of requestedDays) {
            const daySlots = mentor.availability?.find(a => a.day.toLowerCase() === day)?.slots || [];
            const hasSlot = daySlots.some(slot => isSlotMatching(slot.startTime, slot.endTime, reqStart || "", reqEnd));
            if (!hasSlot) return false;
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

      logger.info(`AdminService: Search complete. Found ${matches.length} matches and ${alternates.length} alternates for subject: "${subjectName}"`);
      return { matches, alternates };
    } catch (error: unknown) {
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
      logger.info(`AdminService: Assigning mentor ${mentorId} to student ${studentId} for subject ${subjectId}`);

      let request = await this._requestRepo.findOne({
        studentId: studentId as any,
        subjectId: subjectId as any,
        status: 'pending'
      });

      if (!request) {
        request = await this._requestRepo.create({
          studentId: studentId as any,
          subjectId: subjectId as any,
          mentorId: mentorId as any,
          status: 'pending'
        });
      }

      await this._mentorRequestService.approveRequest(
        (request as unknown as { _id: { toString(): string } })._id.toString(),
        adminId || "system",
        {
          mentorId,
          days: overrides?.days || [],
          timeSlot: overrides?.timeSlot || ""
        }
      );

    } catch (error: unknown) {
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
      logger.info(`AdminService: Reassigning student ${studentId} from old mentor to new mentor ${newMentorId}`);
      
      // STEP 1: Find existing course for this student and subject
      const existingCourses = await this._courseRepo.findByStudent(studentId);
      const course = existingCourses.find((c: import('../models/course.model').ICourse) => 
        (c.subject.toString() === subjectId) &&
        c.isActive && c.status !== 'cancelled'
      );

      if (!course) {
        throw new AppError("No active course found for this student and subject", HttpStatusCode.NOT_FOUND);
      }
      
      const courseIdStr = (course as unknown as { _id: { toString(): string } })._id.toString();
      const oldMentorId = course.mentor.toString();
      logger.info(`AdminService: Found course ${courseIdStr}, old mentor: ${oldMentorId}, new mentor: ${newMentorId}`);

      // STEP 2: Find all FUTURE scheduled sessions for this course
      const now = new Date();
      
      const futureSessions = await this._sessionRepo.find({
          studentId: studentId as any,
          subjectId: subjectId as any,
          startTime: { $gt: now },
          status: 'scheduled'
      });
  
      logger.info(`AdminService: Found ${futureSessions.length} future sessions to reassign dynamically`);
  
      // STEP 3: Release old mentor's time slots for these sessions
      for (const session of futureSessions) {
          const sessionWithTimeSlot = session as unknown as { timeSlotId?: string | { _id: string } };
          const timeSlotId = typeof sessionWithTimeSlot.timeSlotId === 'object' ? sessionWithTimeSlot.timeSlotId?._id : sessionWithTimeSlot.timeSlotId;
          
          if (timeSlotId) {
              const slot = await this._timeSlotRepo.findById(timeSlotId.toString());
              if (slot) {
                  // Decrement count
                  const newCount = Math.max(0, (slot.currentStudentCount || 1) - 1);
                  await this._timeSlotRepo.updateById(timeSlotId.toString(), {
                      currentStudentCount: newCount,
                      status: newCount === 0 ? 'available' : slot.status
                  } as Record<string, unknown>);
              }
          }
      }
  
      // STEP 4: Delete these future sessions (We will regenerate them)
      if (futureSessions.length > 0) {
          const sessionIds = futureSessions.map((s) => s._id);
          await this._sessionRepo.deleteMany({ _id: { $in: sessionIds } });
          logger.info(`AdminService: Deleted ${futureSessions.length} old sessions`);
      }
  
      // STEP 5: Prepare for Regeneration
      // Determine the schedule to use (Overrides OR Course Defaults)
      const targetDays = (overrides?.days && overrides.days.length > 0) 
          ? overrides.days 
          : (course.schedule?.days || []);
          
      const targetTimeSlot = overrides?.timeSlot || course.schedule?.timeSlot;
  
      if (!targetTimeSlot) {
          throw new AppError("Cannot determine time slot for reassignment", HttpStatusCode.BAD_REQUEST);
      }
  
      const [rawStart, rawEnd] = targetTimeSlot.split('-').map(s => s.trim());
      const startTimeStr = normalizeTimeTo24h(rawStart || "00:00");
      const endTimeStr = normalizeTimeTo24h(rawEnd || "00:00");
  
      // Construct slots array
      const newSlots = targetDays.map((d: string) => ({
          day: d,
          startTime: startTimeStr,
          endTime: endTimeStr
      }));
  
      // Calculate remaining weeks
      const endDate = new Date(course.endDate);
      const durationMs = endDate.getTime() - now.getTime();
      const remainingWeeks = Math.ceil(durationMs / (1000 * 60 * 60 * 24 * 7));
  
      logger.info(`AdminService: Regenerating sessions for ${remainingWeeks} weeks using slots:`, newSlots);
  
      // Find suitable enrollment ID
      let enrollmentId = "";
      if (futureSessions.length > 0) {
          enrollmentId = (futureSessions[0] as unknown as { enrollmentId?: { toString(): string } }).enrollmentId?.toString() || "";
      } 
      
       if (!enrollmentId) {
            const enrollment = await this._enrollmentLinkRepo.findOne({ 
                studentId: studentId as any,
                courseId: (course._id as unknown as string),
                isActive: true
            });
            enrollmentId = (enrollment as any)?._id?.toString() || "";
       }
  
      await this._mentorRequestService.generateSessionsForWeeks(
          studentId,
          newMentorId,
          subjectId,
          (course as unknown as { _id: { toString(): string } })._id.toString(),
          enrollmentId,
          newSlots,
          Math.max(1, remainingWeeks),
          (course.courseType as 'one-to-one' | 'group') || 'one-to-one'
      );
      
      logger.info(`AdminService: Successfully regenerated sessions for new mentor`);
  
      // STEP 6: Update course with new mentor and potential schedule change
      const updateData: Record<string, unknown> = {
        mentor: newMentorId
      };
  
      if (overrides?.timeSlot) {
        const newSchedule = {
            ...(course.schedule || {}),
            timeSlot: overrides.timeSlot,
            days: overrides.days && overrides.days.length > 0 ? overrides.days : (course.schedule?.days || [])
        };
        updateData.schedule = newSchedule;
      }
  
      await this._courseRepo.updateCourse((course as unknown as { _id: { toString(): string } })._id.toString(), updateData);
      logger.info(`AdminService: Updated course ${course._id} with new mentor ${newMentorId} and schedule`);

      // STEP 5: Update mentor assignment request
      const request = await this._requestRepo.findOne({
        studentId: studentId as any,
        subjectId: subjectId as any
      });

      if (request) {
        await this._requestRepo.updateStatus(
          (request as unknown as { _id: { toString(): string } })._id.toString(),
          'approved',
          adminId || 'system'
        );
      }

      // STEP 6: Notify student and mentors
      const student = await this._studentRepo.findById(studentId);
      const newMentor = await this._mentorRepo.findById(newMentorId);
      const oldMentor = oldMentorId ? await this._mentorRepo.findById(oldMentorId) : null;

      if (student && newMentor) {
        // Notify student
        await this._notificationService.notifyUser(
          studentId,
          'student',
          'mentor_reassigned',
          { 
            newMentorName: newMentor.fullName,
            subjectName: (course as unknown as { subject?: { subjectName?: string } }).subject?.subjectName || 'Subject'
          },
          ['web']
        );

        // Notify new mentor
        await this._notificationService.notifyUser(
          newMentorId,
          'mentor',
          'mentor_assigned',
          {
            studentName: student.fullName,
            subjectName: (course as unknown as { subject?: { subjectName?: string } }).subject?.subjectName || 'Subject'
          },
          ['web']
        );

        // Notify old mentor (if exists)
        if (oldMentorId && oldMentor) {
          await this._notificationService.notifyUser(
            oldMentorId,
            'mentor',
            'session_cancelled',
            {
              studentName: student.fullName,
              subjectName: (course as unknown as { subject?: { subjectName?: string } }).subject?.subjectName || 'Subject',
              reason: 'Student reassigned to another mentor'
            },
            ['web']
          );
        }
      }

      logger.info(`AdminService: Successfully reassigned student ${studentId} to mentor ${newMentorId}`);

    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      logger.error(`AdminService: Error reassigning mentor`, error);
      throw new AppError(
        `Failed to reassign mentor: ${error instanceof Error ? error.message : "Unknown error"}`, 
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async searchStudents(query: string): Promise<StudentBaseResponseDto[]> {
    try {
      logger.info(`AdminService: Searching students with query: ${query}`);
      const students = await this._studentRepo.searchStudents(query);
      return students.map(s => {
        const authUser = { ...(s as unknown as Record<string, unknown>), role: 'student' as const } as unknown as import('../interfaces/auth/auth.interface').StudentAuthUser;
        return StudentMapper.toStudentResponseDto(authUser);
      });
    } catch (error: unknown) {
      logger.error(`AdminService: Error searching students:`, error);
      throw error;
    }
  }

  async getFinanceStats(): Promise<FinanceDashboardDataDto> {
    try {
      const totalRevenue = await this._paymentRepo.getTotalRevenue();
      const totalPayments = await this._paymentRepo.countDocuments(); 
      const monthlyRevenue = await this._paymentRepo.getMonthlyRevenue();
      const revenuePerStudent = await this._paymentRepo.getRevenuePerStudent();

      return {
        totalRevenue,
        monthlyRevenue,
        totalPayments,
        revenuePerStudent
      };
    } catch (error: unknown) {
      logger.error('Error calculating finance stats:', error);
      throw new AppError('Failed to calculate finance statistics', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}