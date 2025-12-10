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
import { StudentMapper } from "@/mappers/StudentMapper";
import bcrypt from "bcryptjs";
import type { StudentAuthUser } from "@/interfaces/auth/auth.interface";
import { TrialClassMapper } from "@/mappers/trialClassMapper";
import { TrialClass, type ITrialClassDocument } from "@/models/student/trialClass.model";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type { TrialClassResponseDto } from "@/dto/student/trialClassDTO";
import type { ISubjectRepository } from "@/interfaces/repositories/ISubjectRepository";
import type { MentorPaginationParams, StudentPaginationParams, PaginatedResponse } from "@/dto/shared/paginationTypes";


@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IAdminRepository) private _adminRepo: IAdminRepository,
    @inject(TYPES.IMentorRepository) private _mentorRepo: IMentorRepository,
    @inject(TYPES.IEmailService) private _emailService: IEmailService,
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository,
    @inject(TYPES.ITrialClassRepository) private _trialClassRepo: ITrialClassRepository,
    @inject(TYPES.ISubjectRepository) private _subjectRepo: ISubjectRepository,
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
      const studentDtos = result.students.map(student => ({
        id: student._id?.toString() || student.id,
        fullName: student.fullName,
        email: student.email,
        phoneNumber: student.phoneNumber || '',
        role: 'student' as const,
        isVerified: student.isVerified || false,
        isProfileComplete: student.isProfileComplete || false,
        isPaid: student.isPaid || false,
        isBlocked: student.isBlocked || false,
        totalTrialClasses: student.totalTrialClasses || 0,
        pendingTrialClasses: student.pendingTrialClasses || 0,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt,
      }));

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
    const { _id, password, email, createdAt, updatedAt, ...updateData } = data;

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
      approvalStatus: "approved" as const,
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

  async getAllTrialClasses(filters: { status?: string; page?: number; limit?: number }): Promise<any> {
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
async getAvailableMentors(subjectId: string, preferredDate: string): Promise<MentorResponseDto[]> {
  try {
    logger.info(`AdminService: Fetching available mentors for subject ${subjectId} on ${preferredDate}`);

    // First, get the subject details
    const subject = await this._subjectRepo.findById(subjectId);
    if (!subject) {
      throw new AppError("Subject not found", HttpStatusCode.NOT_FOUND);
    }

    console.log('🔍 Looking for mentors with subject:', subject.subjectName);

    // Find mentors who have this subject in their subjectProficiency
    const availableMentors = await this._mentorRepo.findBySubjectProficiency(
      subject.subjectName,
      preferredDate
    );

    console.log('🔍 Found mentors:', availableMentors.length);
    console.log('🔍 Mentors details:', availableMentors.map(m => ({
      id: m._id,
      name: m.fullName,
      subjects: m.subjectProficiency,
      isBlocked: m.isBlocked,
      approvalStatus: m.approvalStatus
    })));

    // Map to response DTOs
    const mentorDtos = availableMentors.map(mentor => 
      MentorMapper.toResponseDto(mentor)
    );

    logger.info(`AdminService: Found ${mentorDtos.length} available mentors for subject ${subject.subjectName}`);
    return mentorDtos;
  } catch (error) {
    logger.error(`AdminService: Error fetching available mentors for subject ${subjectId}`, error);
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Failed to fetch available mentors",
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}

}