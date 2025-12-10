import { injectable, inject } from 'inversify';
import { ImageService } from '@/services/imageService';
import type { IStudentService } from "../interfaces/services/IStudentService";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type { AuthUser } from "../interfaces/auth/auth.interface";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { HttpStatusCode } from "../constants/httpStatus";
import { TYPES } from '../types';
import type { StudentBaseResponseDto } from '@/dto/auth/UserResponseDTO';
import { StudentMapper } from '@/mappers/StudentMapper';

@injectable()
export class StudentService implements IStudentService {
  constructor(
    @inject(TYPES.IStudentRepository) private studentRepo: IStudentRepository
  ) {}

  async registerStudent(data: AuthUser): Promise<AuthUser> {
    try {
      const existing = await this.studentRepo.findByEmail(data.email);
      if (existing) {
        logger.warn(`Attempted to register existing student: ${data.email}`);
        const error = new Error("Student already exists");
        (error as any).statusCode = HttpStatusCode.BAD_REQUEST;
        throw error;
      }

      const student = await this.studentRepo.createUser(data);
      logger.info(`Student registered successfully: ${student.email}`);
      return student;
    } catch (error: unknown) {
      logger.error(
        `Student registration failed for ${data.email}: ${getErrorMessage(error)}`
      );
      throw error;
    }
  }

  async findStudentByEmail(email: string): Promise<any> {
    try {
      logger.debug(`Finding student by email: ${email}`);
      return await this.studentRepo.findByEmail(email);
    } catch (error: unknown) {
      logger.error(`Error finding student by email ${email}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  async createStudent(studentData: any): Promise<any> {
    try {
      logger.info(`Creating student: ${studentData.email}`);
      const student = await this.studentRepo.createUser(studentData);
      logger.info(`Student created successfully: ${student.email}`);
      return student;
    } catch (error: unknown) {
      logger.error(`Error creating student ${studentData.email}`, { error: getErrorMessage(error) });
      throw error;
    }
  }


  async getById(id: string): Promise<StudentBaseResponseDto | null> {
    const student = await this.studentRepo.findById(id);
    if (!student) return null;

    // Inject role dynamically since DB doesn't have it
    const dto = StudentMapper.toStudentResponseDto(student);
    return { ...dto, role: "student" };
  }

  async updateProfile(id: string, data: any): Promise<any> {
    try {
      logger.info(`Updating profile for student: ${id}`);
      
      // Handle profile picture upload if provided
      if (data.profileImage) {
          try {
            const imageKey = await this.handleProfilePictureUpload(data.profileImage);
            data.profileImage = imageKey;
            data.profileImageKey = imageKey; // Also save to profileImageKey if needed
            logger.debug(`Profile image uploaded for student: ${id}, Key: ${imageKey}`);
          } catch (uploadError: unknown) {
            logger.error(`Error uploading profile image for student ${id}: ${getErrorMessage(uploadError)}`);
            throw new Error(`Failed to upload profile image: ${getErrorMessage(uploadError)}`);
          }
        }

      // Handle ID proof upload if provided
      if (data.idProof) {
        try {
          data.idProof = await this.handleProfilePictureUpload(data.idProof);
          logger.debug(`ID proof uploaded for student: ${id}`);
        } catch (uploadError: unknown) {
          logger.error(`Error uploading ID proof for student ${id}: ${getErrorMessage(uploadError)}`);
          throw new Error(`Failed to upload ID proof: ${getErrorMessage(uploadError)}`);
        }
      }
      
      // Determine if profile is complete based on required fields
      const isProfileCompleted = Boolean(
        data.fullName && 
        data.emailId && 
        data.phoneNumber &&
        data.grade &&
        data.syllabus
      );

      const updateData = { ...data, isProfileCompleted };
      
      const updatedStudent = await this.studentRepo.updateProfile(id, updateData);
      logger.info(`Student profile updated successfully: ${id}`);
      return updatedStudent;
    } catch (error: unknown) {
      logger.error(`Error updating student profile ${id}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  private async handleProfilePictureUpload(file: any): Promise<string> {
    try {
      logger.debug("Handling profile picture upload:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      });

      if (!file) throw new Error("No file provided for profile picture");

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.mimetype}`);
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) throw new Error("File too large (max 5MB)");

      const { uploadFileToS3 } = await import("../utils/s3Upload");
      const imageKey = await uploadFileToS3(file);

      logger.info(`Profile picture uploaded successfully to S3: ${imageKey}`);
      return imageKey;
    } catch (error: unknown) {
      logger.error(`Error uploading profile picture: ${getErrorMessage(error)}`);
      throw new Error(`Failed to upload profile picture: ${getErrorMessage(error)}`);
    }
  }

  async getStudentProfileById(id: string): Promise<any> {
    try {
      logger.info(`Fetching complete profile for student: ${id}`);
      const profile = await this.studentRepo.findStudentProfileById(id);
      
      if (!profile) {
        const error = new Error("Student not found");
        (error as any).statusCode = HttpStatusCode.NOT_FOUND;
        throw error;
      }

      logger.info(`Student profile retrieved successfully: ${id}`);
      return profile;
    } catch (error: unknown) {
      logger.error(`Error fetching student profile ${id}`, { error: getErrorMessage(error) });
      throw error;
    }
  }
  
}

  
