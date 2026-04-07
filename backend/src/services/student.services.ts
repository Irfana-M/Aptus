import { injectable, inject } from 'inversify';

import type { IStudentService } from "../interfaces/services/IStudentService";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type { IGradeRepository } from "../interfaces/repositories/IGradeRepository";
import type { AuthUser } from "../interfaces/auth/auth.interface";
import { logger } from "../utils/logger";
import { getErrorMessage } from "../utils/errorUtils";
import { HttpStatusCode } from "../constants/httpStatus";
import { TYPES } from '../types';
import type { StudentBaseResponseDto } from '@/dtos/auth/UserResponseDTO';
import { StudentMapper } from '@/mappers/StudentMapper';
import type { StudentProfile, StudentRegisterInput, AcademicDetails, contactInfo, ParentInfo } from '@/interfaces/models/student.interface';
import { AppError } from '@/utils/AppError';
import { MESSAGES } from '@/constants/messages.constants';

import type { INotificationService } from '../interfaces/services/INotificationService';
import { InternalEventEmitter } from '../utils/InternalEventEmitter';
import { EVENTS } from '../utils/InternalEventEmitter';
import { PLAN_LIMITS } from '../constants/plans';
import { PlanType } from '../enums/plan.enum';
import type { ICourseRepository } from '../interfaces/repositories/ICourseRepository';
import { OnboardingEvent, StudentOnboardingStatus } from '../enums/studentOnboarding.enum';
import type { IEnrollmentService } from '../interfaces/services/IEnrollmentService';
import type { ICourseRequestRepository } from '../interfaces/repositories/ICourseRequestRepository';
import type { ISubjectRepository } from '../interfaces/repositories/ISubjectRepository';

@injectable()
export class StudentService implements IStudentService {
  constructor(
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository,
    @inject(TYPES.IGradeRepository) private _gradeRepo: IGradeRepository,
    @inject(TYPES.INotificationService) private _notificationService: INotificationService,
    @inject(TYPES.IMentorAssignmentRequestRepository) private _mentorRequestRepo: import("../interfaces/repositories/IMentorAssignmentRequestRepository").IMentorAssignmentRequestRepository,
    @inject(TYPES.ICourseRepository) private _courseRepo: ICourseRepository,
    @inject(TYPES.IEnrollmentService) private _enrollmentService: IEnrollmentService,
    @inject(TYPES.ICourseRequestRepository) private _courseRequestRepo: ICourseRequestRepository,
    @inject(TYPES.ISubjectRepository) private _subjectRepo: ISubjectRepository,
    @inject(TYPES.InternalEventEmitter) private _eventEmitter: InternalEventEmitter
  ) {}

  async registerStudent(data: AuthUser): Promise<AuthUser> {
    try {
      const existing = await this._studentRepo.findByEmail(data.email);
      if (existing) {
        logger.warn(`Attempted to register existing student: ${data.email}`);
        throw new AppError(MESSAGES.AUTH.USER_EXISTS, HttpStatusCode.BAD_REQUEST);
      }

      const student = await this._studentRepo.createUser(data);
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
      const student = await this._studentRepo.findByEmail(email);
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
      
      const student = await this._studentRepo.createUser(newUser);
      logger.info(`Student created successfully: ${student.email}`);
      return student;
    } catch (error: unknown) {
      logger.error(`Error creating student ${studentData.email}`, { error: getErrorMessage(error) });
      throw error;
    }
  }


  async getById(id: string): Promise<StudentBaseResponseDto | null> {
    const student = await this._studentRepo.findById(id);
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
            const imageKey = await this._handleProfilePictureUpload(data.profileImage as unknown);
            data.profileImage = imageKey;
            data.profileImageKey = imageKey; // Also save to profileImageKey if needed
            logger.debug(`Profile image uploaded for student: ${id}, Key: ${imageKey}`);
          } catch (uploadError: unknown) {
            logger.error(`Error uploading profile image for student ${id}: ${getErrorMessage(uploadError)}`);
            throw new Error(MESSAGES.STUDENT.UPLOAD_FAILED("profile image"));
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
      const currentStudent = await this._studentRepo.findById(id);
      if (!currentStudent) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);

      const studentObj = currentStudent as unknown as StudentProfile;

      // 3. Merging and mapping data using StudentMapper
      // 1. Resolve effective update data using StudentMapper (Nested > Flat precedence)
      const updateDataMapped = StudentMapper.toNestedUpdate(data);
      const dataAny = data as any;

      // 2. Resolve gradeId if grade and syllabus are provided (from any source)
      const gradeName = (data.academicDetails?.grade || dataAny.grade) as string;
      const syllabus = (data.academicDetails?.syllabus || dataAny.syllabus) as string;

      if (gradeName && syllabus) {
        try {
          const grade = await this._gradeRepo.findOne({
            name: gradeName,
            syllabus: syllabus.toUpperCase() as "CBSE" | "STATE" | "ICSE",
            isActive: true
          });
          if (grade) {
            updateDataMapped.gradeId = grade._id as unknown as import('mongoose').Types.ObjectId;
            logger.info(`Resolved gradeId: ${grade._id} for Grade: ${gradeName}, Syllabus: ${syllabus}`);
          }
        } catch (error) {
          logger.error(`Error resolving gradeId: ${error}`);
        }
      }

      // 3. For completeness check, merge update with current data using helper
      const mergedForCheck = StudentMapper.applyDottedUpdate(studentObj, updateDataMapped);

      // Check if profile is complete
      const isProfileCompleted = StudentMapper.calculateCompleteness(mergedForCheck);

      // Set the flag in the update object
      updateDataMapped.isProfileCompleted = isProfileCompleted;
      
      // TEMPORARY: Log the final update object for verification
      logger.info(`FINAL STUDENT UPDATE DATA: ${JSON.stringify(updateDataMapped, null, 2)}`);
      
      logger.info(`Profile completion check for ${id}: ${isProfileCompleted}`, {
        hasGender: !!mergedForCheck.gender,
        hasAge: !!mergedForCheck.age,
        hasParentInfo: !!mergedForCheck.contactInfo?.parentInfo?.name,
        missingFields: !isProfileCompleted ? 'CHECK WARN LOGS' : 'NONE'
      });
      
      const updatedStudent = await this._studentRepo.updateProfile(id, updateDataMapped);
      logger.info(`Student profile updated successfully: ${id}, isProfileCompleted: ${isProfileCompleted}`);

      // Auto-advance onboarding status if profile is determined complete
      if (isProfileCompleted) {
          try {
              await this.advanceOnboarding(id, 'PROFILE_COMPLETED');
          } catch (error) {
              // Non-blocking error, just log. 
              // Usually this means they were already advanced or it's an idempotent operation
              logger.warn(`Could not advance onboarding status after profile update for ${id}. This might be expected if already advanced.`, { error: getErrorMessage(error) });
          }
      }

      return updatedStudent as StudentProfile;
    } catch (error: unknown) {
      logger.error(`Error updating student profile ${id}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  private async _handleProfilePictureUpload(file: unknown): Promise<string> {
    const f = file as { originalname: string; mimetype: string; size: number; buffer: Buffer };
    try {
      logger.debug("Handling profile picture upload:", {
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      });

      if (!f) throw new Error(MESSAGES.STUDENT.FILE_REQUIRED("profile picture"));

      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(f.mimetype)) {
        throw new Error(`Invalid file type: ${f.mimetype}`);
      }

      const maxSize = 5 * 1024 * 1024;
      if (f.size > maxSize) throw new Error("File too large (max 5MB)");

      const { uploadFileToS3 } = await import("../utils/s3Upload");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imageKey = await uploadFileToS3(f as any); 


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
      const profile = await this._studentRepo.findStudentProfileById(id);
      
      if (!profile) {
        logger.warn(`Student profile not found: ${id}`);
        throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      }

      logger.info(`Complete student profile retrieved for student: ${id}`);
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

      const student = await this._studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);

      // Handle enum values that might be stored as strings in DB
      const studentProfile = student as StudentProfile;
      const currentStatus = (studentProfile.onboardingStatus || StudentOnboardingStatus.REGISTERED) as StudentOnboardingStatus;
      const newStatus = StudentOnboardingPolicy.getStatusForEvent(event) as StudentOnboardingStatus;

      // Validate transition
      if (!StudentOnboardingPolicy.canTransition(currentStatus, newStatus)) {
        // If already in target state or beyond, we might want to be idempotent or throw
        if (currentStatus === newStatus) return; // Idempotent
        
        logger.warn(`Invalid onboarding transition for student ${studentId}: ${currentStatus} -> ${newStatus}`);
        throw new AppError(MESSAGES.STUDENT.INVALID_TRANSITION(currentStatus), HttpStatusCode.BAD_REQUEST);
      }

      // Update status
      await this._studentRepo.updateProfile(studentId, { onboardingStatus: newStatus });
      logger.info(`Student ${studentId} onboarding advanced: ${currentStatus} -> ${newStatus}`);

    } catch (error: unknown) {
      logger.error(`Error advancing onboarding for student ${studentId}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  async updatePreferences(studentId: string, preferences: Array<{ subjectId: string; slots: Array<{ day: string; startTime: string }> }>): Promise<StudentProfile> {
    try {
      logger.info(`Updating nested preferences for student: ${studentId}`);
      
      const student = await this._studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      
      const studentProfile = student as StudentProfile;
      const planSubjectCount = studentProfile.subscription?.subjectCount || 1;
      
      // 1. Validate subject count and structure
      if (!preferences || preferences.length === 0) {
        throw new AppError(MESSAGES.STUDENT.PREFERENCE_REQUIRED, HttpStatusCode.BAD_REQUEST);
      }
      if (preferences.length > planSubjectCount) {
        throw new AppError(MESSAGES.STUDENT.PLAN_LIMIT_EXCEEDED(planSubjectCount), HttpStatusCode.BAD_REQUEST);
      }
      
      // 2. Validate slots per subject and plan constraints
      const allSelectedSlots: { day: string; startTime: string }[] = [];
      const isBasic = studentProfile.subscription?.planCode === 'BASIC' || studentProfile.subscription?.planType === 'basic';

      preferences.forEach(pref => {
        if (!pref.slots || pref.slots.length === 0) {
          throw new AppError(MESSAGES.STUDENT.SLOT_REQUIRED(pref.subjectId), HttpStatusCode.BAD_REQUEST);
        }

        // Basic Plan Constraint: Exactly 2 sessions (one Sat, one Sun)
        if (isBasic) {
           if (pref.slots.length !== 2) {
             throw new AppError(MESSAGES.STUDENT.BASIC_PLAN_CONSTRAINT, HttpStatusCode.BAD_REQUEST);
           }
           const hasSat = pref.slots.some((s) => s.day === 'Saturday');
           const hasSun = pref.slots.some((s) => s.day === 'Sunday');
           if (!hasSat || !hasSun) {
             throw new AppError(MESSAGES.STUDENT.BASIC_PLAN_CONSTRAINT, HttpStatusCode.BAD_REQUEST);
           }
        }

        pref.slots.forEach((slot) => {
          // Holiday constraint for Basic Plan (Redundant but safe)
          if (isBasic && !['Saturday', 'Sunday'].includes(slot.day)) {
            throw new AppError(MESSAGES.STUDENT.BASIC_PLAN_CONSTRAINT, HttpStatusCode.BAD_REQUEST);
          }

          // Validate Shift Values (MORNING/AFTERNOON) or Time Formats
          const isShift = ['MORNING', 'AFTERNOON', 'FLEXIBLE'].includes(slot.startTime);
          
          // Cross-subject overlap check (simplified for shifts)
          const hasOverlap = allSelectedSlots.some(selectedSlot => selectedSlot.day === slot.day && selectedSlot.startTime === slot.startTime);
          if (hasOverlap && isShift) {
            throw new AppError(MESSAGES.STUDENT.SHIFT_OVERLAP(slot.day, slot.startTime), HttpStatusCode.BAD_REQUEST);
          }
          
          allSelectedSlots.push({ day: slot.day, startTime: slot.startTime });
        });
      });
      
      // 3. Update profile
      const updateData: Partial<StudentProfile> = {
        preferredSubjects: preferences.map(preference => preference.subjectId) as unknown as import('mongoose').Types.ObjectId[],
        preferredTimeSlots: preferences as unknown as import('../interfaces/models/student.interface').SubjectPreference[],
        preferencesCompleted: true
      };
      
      const updatedStudent = await this._studentRepo.updateProfile(studentId, updateData);
      
      // 4. Handle Group Course Requests for Basic Plan
      if (isBasic) {
        // Robust ID Extraction Helper
        const toValidId = (id: unknown): string | null => {
            if (!id) return null;
            const idObj = id as { _id?: string | { toString(): string } };
            const idStr = (typeof id === 'object' && idObj && '_id' in idObj && idObj._id) ? idObj._id.toString() : (id as string | { toString(): string }).toString();
            return /^[0-9a-fA-F]{24}$/.test(idStr) ? idStr : null;
        };

        const gradeVal = studentProfile.gradeId || studentProfile.academicDetails?.grade;
        const validGradeId = toValidId(gradeVal);
        
        logger.info(`[StudentService] Processing CourseRequests for student ${studentId}. Grade info:`, { gradeVal, validGradeId });

        for (const pref of preferences) {
          const validSubId = toValidId(pref.subjectId);
          if (!validSubId) {
              logger.warn(`[StudentService] Invalid subjectId for preference: ${pref.subjectId}`);
              continue;
          }

          // Fetch subject details for accurate names and syllabus
          const subjectDoc = await this._subjectRepo.findById(validSubId);
          
          // Upsert CourseRequest: one per student per subject
          const existingRequest = await this._courseRequestRepo.findOne({
            student: studentId as unknown as import('mongoose').Types.ObjectId,
            subjectId: validSubId as unknown as import('mongoose').Types.ObjectId,
            status: { $in: ['pending', 'approved', 'reviewed'] }
          }) || await this._courseRequestRepo.findOne({ // Fallback to name search for legacy requests
            student: studentId as unknown as import('mongoose').Types.ObjectId,
            subject: subjectDoc?.subjectName || pref.subjectId,
            status: { $in: ['pending', 'approved', 'reviewed'] }
          });

          const requestData: Record<string, unknown> = {
            student: studentId,
            subject: subjectDoc?.subjectName || pref.subjectId,
            subjectId: validSubId,
            grade: (studentProfile.gradeId as unknown as { name?: string })?.name || studentProfile.academicDetails?.grade || 'N/A',
            syllabus: subjectDoc?.syllabus || studentProfile.academicDetails?.syllabus,
            mentoringMode: 'group',
            status: 'pending',
            preferredDays: pref.slots.map(slot => slot.day),
            timeSlot: pref.slots[0]?.startTime, 
            timezone: studentProfile.contactInfo?.address || 'UTC' // Falling back to address if timezone not in profile
          };

          if (validGradeId) {
              requestData.gradeId = validGradeId;
          }

          if (existingRequest) {
            await this._courseRequestRepo.updateById((existingRequest as unknown as { _id: { toString(): string } })._id.toString(), requestData);
          } else {
            await this._courseRequestRepo.create(requestData);
          }
        }
      }

      // 5. Advance onboarding
      try {
        await this.advanceOnboarding(studentId, 'PREFERENCES_COMPLETED' as import('../enums/studentOnboarding.enum').OnboardingEvent);
      } catch (error) {
        logger.warn(`Failed to advance onboarding to PREFERENCES_COMPLETED for ${studentId}`, { error: getErrorMessage(error) });
      }

      // 5. Notifications via events
      const studentName = (updatedStudent as unknown as { fullName?: string })?.fullName || "Student";
      this._eventEmitter.emit(EVENTS.PREFERENCES_SUBMITTED, {
        studentId,
        studentName,
        adminId: "SYSTEM_ADMIN" 
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

      const student = await this._studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);


      // 1. Check for existing pending request
      const existingRequest = await this._mentorRequestRepo.findOne({
        studentId: studentId as unknown as import('mongoose').Types.ObjectId,
        subjectId: subjectId as unknown as import('mongoose').Types.ObjectId,
        status: 'pending'
      });

      if (existingRequest) {
        throw new AppError(MESSAGES.STUDENT.PENDING_REQUEST_EXISTS, HttpStatusCode.CONFLICT);
      }

      // 2. Update Student Preferred Time Slot Status
      const studentProfile = student as StudentProfile;
      const subjectPreferenceIndex = studentProfile.preferredTimeSlots?.findIndex(
        (slot) => (slot.subjectId as unknown as { toString(): string }).toString() === subjectId ||
          (slot.subjectId as unknown as { _id?: { toString(): string } })._id?.toString() === subjectId
      );

      if (
        subjectPreferenceIndex === undefined || subjectPreferenceIndex === -1
      ) {
        throw new AppError(MESSAGES.STUDENT.PREFERENCES_MISSING, HttpStatusCode.BAD_REQUEST);
      }

      // We need to use updateOne directly to target the specific array element
      await this._studentRepo.updateProfile(studentId, {
        [`preferredTimeSlots.${subjectPreferenceIndex}.status`]: 'mentor_requested'
      } as Partial<StudentProfile>);

      // 3. Create MentorAssignmentRequest
      await this._mentorRequestRepo.create({
        studentId: studentId as unknown as import('mongoose').Types.ObjectId,
        subjectId: subjectId as unknown as import('mongoose').Types.ObjectId,
        mentorId: mentorId as unknown as import('mongoose').Types.ObjectId,
        status: 'pending'
      });

      // 4. Send Notification via event
      this._eventEmitter.emit(EVENTS.MENTOR_REQUEST_SUBMITTED, {
        studentId,
        studentName: studentProfile.fullName || "Student",
        mentorName: "Mentor", 
        subjectName: "Subject", 
        adminId: "SYSTEM_ADMIN"
      });

    } catch (error: unknown) {
      logger.error(`Error requesting mentor for student ${studentId}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

  async updateBasicPreferences(studentId: string, subjectIds: string[]): Promise<StudentProfile> {
    try {
      logger.info(`Updating basic preferences for student: ${studentId}, Subjects: ${subjectIds}`);
      
      const student = await this._studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND);
      
      const studentProfile = student as StudentProfile;
      const planSubjectCount = studentProfile.subscription?.subjectCount || 1;
      
      if (!subjectIds || subjectIds.length === 0) {
        throw new AppError(MESSAGES.STUDENT.PREFERENCE_REQUIRED, HttpStatusCode.BAD_REQUEST);
      }
      if (subjectIds.length > planSubjectCount) {
        throw new AppError(MESSAGES.STUDENT.PLAN_LIMIT_EXCEEDED(planSubjectCount), HttpStatusCode.BAD_REQUEST);
      }

      // Process each subject
      for (const subjectId of subjectIds) {
        // 1. Search for existing group course with capacity
        const maxGroupSize = PLAN_LIMITS[PlanType.BASIC].maxGroupSize;
        
        const existingGroup = await this._courseRepo.findOne({
          subject: subjectId,
          courseType: 'group',
          status: 'available',
          enrolledStudents: { $lt: maxGroupSize },
          isActive: true,
          // Optimization: Check for grade as well if student's grade is known
          grade: studentProfile.gradeId || studentProfile.academicDetails?.grade
        } as unknown as Record<string, unknown>);

        if (existingGroup) {
          logger.info(`Found existing group course ${existingGroup._id}. Enrolling student ${studentId}`);
          await this._enrollmentService.enrollInCourse(studentId, (existingGroup as unknown as { _id: { toString(): string } })._id.toString());
          
          // Increment enrolledStudents count
          await this._courseRepo.updateCourse((existingGroup as unknown as { _id: { toString(): string } })._id.toString(), { 
            $inc: { enrolledStudents: 1 } 
          } as unknown as Record<string, unknown>);

          // Emit notification event for mentor
          this._eventEmitter.emit(EVENTS.MENTOR_STUDENT_ASSIGNED, {
            studentId,
            studentName: studentProfile.fullName,
            courseId: (existingGroup as unknown as { _id: { toString(): string } })._id.toString(),
            mentorId: (existingGroup as unknown as { mentor?: { toString(): string } }).mentor?.toString()
          });
        } else {
          logger.info(`No existing group found for subject ${subjectId}. Creating Admin request.`);
          // 3. Create CourseRequest for Admin
          const gradeVal = studentProfile.gradeId || studentProfile.academicDetails?.grade;
          const finalGradeId = (gradeVal && typeof gradeVal === 'object' && '_id' in gradeVal) ? (gradeVal as unknown as { _id: { toString(): string } })._id.toString() : gradeVal;

          await this._courseRequestRepo.create({
            student: studentId,
            subject: subjectId,
            grade: finalGradeId || 'N/A',
            mentoringMode: 'group',
            status: 'pending',
            preferredDays: [], // Flexible
            timeSlot: "FLEXIBLE",    // Flexible
            timezone: studentProfile.contactInfo?.address || 'UTC' // Falling back to address or timezone if available
          });

          // Notify Admin
          this._eventEmitter.emit(EVENTS.PREFERENCES_SUBMITTED, {
            studentId,
            studentName: studentProfile.fullName,
            subjectId,
            adminId: "SYSTEM_ADMIN"
          });
        }
      }

      // Advance onboarding
      try {
        await this.advanceOnboarding(studentId, 'PREFERENCES_COMPLETED' as unknown as OnboardingEvent);
      } catch (error) {
        logger.warn(`Failed to advance onboarding to PREFERENCES_COMPLETED for ${studentId}`, { error: getErrorMessage(error) });
      }

      // Set preferencesCompleted flag
      const updateData: Partial<StudentProfile> = {
        preferredSubjects: subjectIds as unknown as import('mongoose').Types.ObjectId[],
        preferencesCompleted: true
      };
      
      return await this._studentRepo.updateProfile(studentId, updateData) as StudentProfile;

    } catch (error: unknown) {
      logger.error(`Error updating basic preferences for student ${studentId}`, { error: getErrorMessage(error) });
      throw error;
    }
  }

}


