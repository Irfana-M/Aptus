import { injectable, inject } from 'inversify';
import mongoose from 'mongoose';
import type { IStudentService } from "../interfaces/services/IStudentService";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type { IGradeRepository } from "../interfaces/repositories/IGradeRepository";
import type { AuthUser } from "../interfaces/auth/auth.interface";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { HttpStatusCode } from "../constants/httpStatus";
import { TYPES } from '../types';
import type { StudentBaseResponseDto } from '@/dto/auth/UserResponseDTO';
import { StudentMapper } from '@/mappers/StudentMapper';
import type { StudentProfile, StudentRegisterInput } from '@/interfaces/models/student.interface';
import { AppError } from '@/utils/AppError';

import type { INotificationService } from '../interfaces/services/INotificationService';
import { InternalEventEmitter } from '../utils/InternalEventEmitter';
import { EVENTS } from '../utils/InternalEventEmitter';

@injectable()
export class StudentService implements IStudentService {
  constructor(
    @inject(TYPES.IStudentRepository) private studentRepo: IStudentRepository,
    @inject(TYPES.IGradeRepository) private gradeRepo: IGradeRepository,
    @inject(TYPES.INotificationService) private notificationService: INotificationService,
    @inject(TYPES.IMentorAssignmentRequestRepository) private mentorRequestRepo: import("../interfaces/repositories/IMentorAssignmentRequestRepository").IMentorAssignmentRequestRepository,
    @inject(TYPES.InternalEventEmitter) private eventEmitter: InternalEventEmitter
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
      const dataAny = data as any;

      // 2. Academic Details
      if (dataAny.institution !== undefined || dataAny.institutionName !== undefined || 
          dataAny.grade !== undefined || dataAny.gradeId !== undefined || dataAny.syllabus !== undefined ||
          dataAny.academicDetails !== undefined) {
          
          const existingAcademic = (updateDataFlat as any).academicDetails || {};
          const newAcademic: any = { ...existingAcademic };

          if (dataAny.institution !== undefined) newAcademic.institutionName = dataAny.institution;
          if (dataAny.institutionName !== undefined) newAcademic.institutionName = dataAny.institutionName;
          if (dataAny.grade !== undefined) newAcademic.grade = dataAny.grade;
          if (dataAny.syllabus !== undefined) newAcademic.syllabus = dataAny.syllabus;
          
          if (dataAny.academicDetails) {
              Object.assign(newAcademic, dataAny.academicDetails);
          }
          
          (updateDataFlat as any).academicDetails = newAcademic;

          // RESOLVE gradeId if grade (name) and syllabus are available
          const gradeName = dataAny.grade || newAcademic.grade;
          const syllabus = dataAny.syllabus || newAcademic.syllabus;

          if (gradeName && syllabus) {
            try {
              const gradeDoc = await this.gradeRepo.findOne({
                name: gradeName,
                syllabus: syllabus.toUpperCase(),
                isActive: true
              });
              if (gradeDoc) {
                (updateDataFlat as any).gradeId = gradeDoc._id;
                logger.info(`Resolved gradeId: ${gradeDoc._id} for Grade: ${gradeName}, Syllabus: ${syllabus}`);
              } else {
                logger.warn(`Could not resolve gradeId for Grade: ${gradeName}, Syllabus: ${syllabus}`);
              }
            } catch (e) {
              logger.error(`Error resolving gradeId: ${e}`);
            }
          }
      }
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
      );

      // Log exact reason for failure
      if (!isProfileCompleted) {
          const missing = [];
          if (!mergedForCheck.fullName) missing.push('fullName');
          if (!mergedForCheck.email) missing.push('email');
          if (!mergedForCheck.phoneNumber) missing.push('phoneNumber');
          if (!mergedForCheck.gender) missing.push('gender');
          if (!mergedForCheck.dateOfBirth) missing.push('dateOfBirth');
          if (!mergedForCheck.age) missing.push('age');
          if (!mergedForCheck.contactInfo?.address) missing.push('address');
          if (!mergedForCheck.contactInfo?.country) missing.push('country');
          if (!mergedForCheck.contactInfo?.parentInfo?.name) missing.push('parentInfo.name');
          if (!mergedForCheck.contactInfo?.parentInfo?.phoneNumber) missing.push('parentInfo.phoneNumber');
          if (!mergedForCheck.contactInfo?.parentInfo?.relationship) missing.push('parentInfo.relationship');
          if (!mergedForCheck.gradeId && !mergedForCheck.academicDetails?.grade) missing.push('grade');
          if (!mergedForCheck.academicDetails?.institutionName) missing.push('institutionName');
          if (!mergedForCheck.academicDetails?.syllabus) missing.push('syllabus');
          
          logger.warn(`Profile completion check failed for ${id}. Missing fields: ${missing.join(', ')}`);
      } else {
          logger.info(`Profile completion check passed for ${id}`);
      }

      // Always set the flag in the update
      (updateDataMapped as Partial<StudentProfile> & { isProfileCompleted?: boolean }).isProfileCompleted = isProfileCompleted;
      
      logger.info(`Profile completion check for ${id}: ${isProfileCompleted}`, {
        hasGender: !!mergedForCheck.gender,
        hasAge: !!mergedForCheck.age,
        hasParentInfo: !!mergedForCheck.contactInfo?.parentInfo?.name,
        missingFields: !isProfileCompleted ? 'CHECK WARN LOGS' : 'NONE'
      });
      
      const updatedStudent = await this.studentRepo.updateProfile(id, updateDataMapped);
      logger.info(`Student profile updated successfully: ${id}, isProfileCompleted: ${isProfileCompleted}`);

      // Auto-advance onboarding status if profile is determined complete
      if (isProfileCompleted) {
          try {
              await this.advanceOnboarding(id, 'PROFILE_COMPLETED');
          } catch (e) {
              // Non-blocking error, just log. 
              // Usually this means they were already advanced or it's an idempotent operation
              logger.warn(`Could not advance onboarding status after profile update for ${id}. This might be expected if already advanced.`, { error: getErrorMessage(e) });
          }
      }

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

  async advanceOnboarding(studentId: string, event: import('../enums/studentOnboarding.enum').OnboardingEvent): Promise<void> {
    try {
      // Lazy load to avoid circular dependency issues if any, though Domain/Policy should be clean
      const { StudentOnboardingPolicy } = await import('../domain/policy/StudentOnboardingPolicy');
      const { StudentOnboardingStatus } = await import('../enums/studentOnboarding.enum');

      const student = await this.studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);

      // Handle enum values that might be stored as strings in DB
      const studentProfile = student as StudentProfile;
      const currentStatus = (studentProfile.onboardingStatus || StudentOnboardingStatus.REGISTERED) as import('../enums/studentOnboarding.enum').StudentOnboardingStatus;
      const newStatus = StudentOnboardingPolicy.getStatusForEvent(event);

      // Validate transition
      if (!StudentOnboardingPolicy.canTransition(currentStatus, newStatus)) {
        // If already in target state or beyond, we might want to be idempotent or throw
        if (currentStatus === newStatus) return; // Idempotent
        
        logger.warn(`Invalid onboarding transition for student ${studentId}: ${currentStatus} -> ${newStatus}`);
        throw new AppError(`Invalid onboarding transition from ${currentStatus}`, HttpStatusCode.BAD_REQUEST);
      }

      // Update status
      await this.studentRepo.updateProfile(studentId, { onboardingStatus: newStatus });
      logger.info(`Student ${studentId} onboarding advanced: ${currentStatus} -> ${newStatus}`);

    } catch (error: unknown) {
      logger.error(`Error advancing onboarding for student ${studentId}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  async updatePreferences(studentId: string, preferences: { subjectId: string; slots: any[] }[]): Promise<StudentProfile> {
    try {
      logger.info(`Updating nested preferences for student: ${studentId}`);
      
      const student = await this.studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
      
      const studentProfile = student as StudentProfile;
      const planSubjectCount = studentProfile.subscription?.subjectCount || 1;
      
      // 1. Validate subject count and structure
      if (!preferences || preferences.length === 0) {
        throw new AppError("At least one subject preference must be selected", HttpStatusCode.BAD_REQUEST);
      }
      if (preferences.length > planSubjectCount) {
        throw new AppError(`You can select up to ${planSubjectCount} subjects based on your plan`, HttpStatusCode.BAD_REQUEST);
      }
      
      // 2. Validate slots per subject
      preferences.forEach(pref => {
        if (!pref.slots || pref.slots.length === 0) {
          throw new AppError(`Subject ${pref.subjectId} must have at least one time slot`, HttpStatusCode.BAD_REQUEST);
        }
      });
      
      // 3. Update profile
      const updateData: Partial<StudentProfile> = {
        preferredSubjects: preferences.map(p => p.subjectId) as any,
        preferredTimeSlots: preferences as any,
        preferencesCompleted: true
      };
      
      const updatedStudent = await this.studentRepo.updateProfile(studentId, updateData);
      
      // 4. Advance onboarding
      try {
        await this.advanceOnboarding(studentId, 'PREFERENCES_COMPLETED' as any);
      } catch (e) {
        logger.warn(`Failed to advance onboarding to PREFERENCES_COMPLETED for ${studentId}`, { error: getErrorMessage(e) });
      }

      // 5. Notifications via events
      const studentName = (updatedStudent as any).fullName || "Student";
      this.eventEmitter.emit(EVENTS.PREFERENCES_SUBMITTED, {
        studentId,
        studentName,
        adminId: "SYSTEM_ADMIN" // Placeholder or fetch real admin
      });
      
      return updatedStudent as StudentProfile;
    } catch (error: unknown) {
      logger.error(`Error updating preferences for student ${studentId}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  async requestMentor(studentId: string, subjectId: string, mentorId: string): Promise<void> {
    try {
      logger.info(`Processing mentor request: Student ${studentId}, Subject ${subjectId}, Mentor ${mentorId}`);

      const student = await this.studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);


      const mongoose = await import('mongoose');

      // 1. Check for existing pending request
      const existingRequest = await this.mentorRequestRepo.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        subjectId: new mongoose.Types.ObjectId(subjectId),
        status: 'pending'
      });

      if (existingRequest) {
        throw new AppError("You already have a pending mentor request for this subject.", HttpStatusCode.CONFLICT);
      }

      // 2. Update Student Preferred Time Slot Status
      const studentProfile = student as StudentProfile;
      const subjectPreferenceIndex = studentProfile.preferredTimeSlots?.findIndex(
        (slot: any) => slot.subjectId.toString() === subjectId || (slot.subjectId._id && slot.subjectId._id.toString() === subjectId)
      );

      if (
        subjectPreferenceIndex === undefined || subjectPreferenceIndex === -1
      ) {
        throw new AppError("Preferences not found for this subject. Please submit preferences first.", HttpStatusCode.BAD_REQUEST);
      }

      // We need to use updateOne directly to target the specific array element
      await this.studentRepo.updateProfile(studentId, {
        [`preferredTimeSlots.${subjectPreferenceIndex}.status`]: 'mentor_requested'
      } as any);

      // 3. Create MentorAssignmentRequest
      await this.mentorRequestRepo.create({
        studentId: new mongoose.Types.ObjectId(studentId),
        subjectId: new mongoose.Types.ObjectId(subjectId),
        mentorId: new mongoose.Types.ObjectId(mentorId),
        status: 'pending'
      });

      // 4. Send Notification via event
      this.eventEmitter.emit(EVENTS.MENTOR_REQUEST_SUBMITTED, {
        studentId,
        studentName: (student as any).fullName || "Student",
        mentorName: "Mentor", // Ideally fetch mentor name
        subjectName: "Subject", // Ideally fetch subject name
        adminId: "SYSTEM_ADMIN"
      });

    } catch (error: unknown) {
      logger.error(`Error requesting mentor for student ${studentId}`, { error: getErrorMessage(error) });
      throw error;
    }
  }
}


