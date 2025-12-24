import { injectable, inject } from 'inversify';
import type { IStudentService } from "../interfaces/services/IStudentService";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type { AuthUser } from "../interfaces/auth/auth.interface";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { HttpStatusCode } from "../constants/httpStatus";
import { TYPES } from '../types';
import type { StudentBaseResponseDto } from '@/dto/auth/UserResponseDTO';
import { StudentMapper } from '@/mappers/StudentMapper';
import type { StudentProfile, StudentRegisterInput } from '@/interfaces/models/student.interface';
import { AppError } from '@/utils/AppError';

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
        logger.warn(`Attempted to register existing student: ${data.email}`);
        throw new AppError("Student already exists", HttpStatusCode.BAD_REQUEST);
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

  async findStudentByEmail(email: string): Promise<AuthUser | null> {
    try {
      logger.debug(`Finding student by email: ${email}`);
      const student = await this.studentRepo.findByEmail(email);
      return student;
    } catch (error: unknown) {
      logger.error(`Error finding student by email ${email}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  async createStudent(studentData: StudentRegisterInput): Promise<AuthUser> {
    try {
      logger.info(`Creating student: ${studentData.email}`);
      // Cast to AuthUser for creation, assuming ID is generated and defaults are handled
      const newUser = {
          ...studentData,
          role: 'student',
          isVerified: false
      } as unknown as AuthUser;
      
      const student = await this.studentRepo.createUser(newUser);
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

  async updateProfile(id: string, data: Partial<StudentProfile>): Promise<StudentProfile> {
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

      
      /*
      // Handle ID proof upload if provided 
      // NOTE: idProof is not in StudentSchema. Disabling until model update.
      if ((data as any).idProof) {
        try {
          (data as any).idProof = await this.handleProfilePictureUpload((data as any).idProof);
          logger.debug(`ID proof uploaded for student: ${id}`);
        } catch (uploadError: unknown) {
          logger.error(`Error uploading ID proof for student ${id}: ${getErrorMessage(uploadError)}`);
          throw new Error(`Failed to upload ID proof: ${getErrorMessage(uploadError)}`);
        }
      }
      */
      
      // 1. Fetch current student to merge data for completeness check
      const currentStudent = await this.studentRepo.findById(id);
      if (!currentStudent) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);

      const studentObj = currentStudent as unknown as StudentProfile;

      // 3. Merging and mapping data using StudentMapper
      const updateDataFlat = { ...data };
      const updateDataMapped = StudentMapper.toProfileUpdate(updateDataFlat);

      // Merge manually for completeness check if needed, but StudentMapper handles the nesting
      const mergedForCheck = {
        ...studentObj,
        ...updateDataMapped,
        contactInfo: {
            ...studentObj.contactInfo,
            ...updateDataMapped.contactInfo,
            parentInfo: {
                ...(studentObj.contactInfo?.parentInfo || {}),
                ...(updateDataMapped.contactInfo?.parentInfo || {})
            }
        },
        academicDetails: {
            ...studentObj.academicDetails,
            ...updateDataMapped.academicDetails
        }
      };

      // Check if profile is complete based on essential fields only
      const isProfileCompleted = Boolean(
        mergedForCheck.fullName && 
        mergedForCheck.email && 
        mergedForCheck.phoneNumber &&
        mergedForCheck.gender &&
        mergedForCheck.dateOfBirth &&
        mergedForCheck.age &&
        mergedForCheck.contactInfo?.address &&
        mergedForCheck.contactInfo?.country &&
        mergedForCheck.contactInfo?.parentInfo?.name &&
        mergedForCheck.contactInfo?.parentInfo?.phoneNumber &&
        mergedForCheck.contactInfo?.parentInfo?.relationship &&
        (mergedForCheck.gradeId || mergedForCheck.academicDetails?.grade) &&
        mergedForCheck.academicDetails?.institutionName &&
        mergedForCheck.academicDetails?.syllabus
        // Note: 'goal' is optional, not required for profile completion
      );

      // Always set the flag in the update
      (updateDataMapped as Partial<StudentProfile> & { isProfileCompleted?: boolean }).isProfileCompleted = isProfileCompleted;
      
      logger.info(`Profile completion check for ${id}: ${isProfileCompleted}`, {
        hasGender: !!mergedForCheck.gender,
        hasAge: !!mergedForCheck.age,
        hasAddress: !!mergedForCheck.contactInfo?.address,
        hasParentInfo: !!mergedForCheck.contactInfo?.parentInfo?.name,
        hasAcademicDetails: !!(mergedForCheck.gradeId || mergedForCheck.academicDetails?.grade)
      });
      
      const updatedStudent = await this.studentRepo.updateProfile(id, updateDataMapped);
      logger.info(`Student profile updated successfully: ${id}, isProfileCompleted: ${isProfileCompleted}`);
      return updatedStudent as StudentProfile;
    } catch (error: unknown) {
      logger.error(`Error updating student profile ${id}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  async getStudentProfileById(id: string): Promise<StudentProfile | null> {
    try {
      logger.info(`Fetching complete profile for student: ${id}`);
      const profile = await this.studentRepo.findStudentProfileById(id);
      
      if (!profile) {
        throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
      }

      logger.info(`Student profile retrieved successfully: ${id}`);
      return profile as StudentProfile;
    } catch (error: unknown) {
      logger.error(`Error fetching student profile ${id}`, { error: getErrorMessage(error) });
      throw error;
    }
  }
  
}

  
