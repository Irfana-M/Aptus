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

import type { INotificationService } from '../interfaces/services/INotificationService';
import { InternalEventEmitter } from '../utils/InternalEventEmitter';
import { EVENTS } from '../utils/InternalEventEmitter';
import { PLAN_LIMITS } from '../constants/plans';
import { PlanType } from '../enums/plan.enum';
import type { ICourseRepository } from '../interfaces/repositories/ICourseRepository';
import { ApprovalStatus } from '../domain/enums/ApprovalStatus';
import { StudentOnboardingStatus } from '../enums/studentOnboarding.enum';
import type { IEnrollmentService } from '../interfaces/services/IEnrollmentService';
import type { ICourseRequestRepository } from '../interfaces/repositories/ICourseRequestRepository';
import type { ISubjectRepository } from '../interfaces/repositories/ISubjectRepository';

@injectable()
export class StudentService implements IStudentService {
  constructor(
    @inject(TYPES.IStudentRepository) private studentRepo: IStudentRepository,
    @inject(TYPES.IGradeRepository) private gradeRepo: IGradeRepository,
    @inject(TYPES.INotificationService) private notificationService: INotificationService,
    @inject(TYPES.IMentorAssignmentRequestRepository) private mentorRequestRepo: import("../interfaces/repositories/IMentorAssignmentRequestRepository").IMentorAssignmentRequestRepository,
    @inject(TYPES.ICourseRepository) private courseRepo: ICourseRepository,
    @inject(TYPES.IEnrollmentService) private enrollmentService: IEnrollmentService,
    @inject(TYPES.ICourseRequestRepository) private courseRequestRepo: ICourseRequestRepository,
    @inject(TYPES.ISubjectRepository) private subjectRepo: ISubjectRepository,
    @inject(TYPES.InternalEventEmitter) private eventEmitter: InternalEventEmitter
  ) {}

  async registerStudent(data: AuthUser): Promise<AuthUser> {
    try {
      const existing = await this.studentRepo.findByEmail(data.email);
      if (existing) {
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
            const imageKey = await this.handleProfilePictureUpload(data.profileImage as unknown);
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
      const updateDataFlat = { ...data } as Partial<StudentProfile> & Record<string, unknown>;
      const dataAny = data as Record<string, unknown>;

      if (dataAny.institution !== undefined || dataAny.institutionName !== undefined || 
          dataAny.grade !== undefined || dataAny.gradeId !== undefined || dataAny.syllabus !== undefined ||
          dataAny.academicDetails !== undefined) {
          
          const existingAcademic = updateDataFlat.academicDetails || {} as AcademicDetails;
          const newAcademic: Partial<AcademicDetails> = { ...existingAcademic };

          if (dataAny.institution !== undefined) newAcademic.institutionName = dataAny.institution as string;
          if (dataAny.institutionName !== undefined) newAcademic.institutionName = dataAny.institutionName as string;
          if (dataAny.grade !== undefined) newAcademic.grade = dataAny.grade as string;
          if (dataAny.syllabus !== undefined) newAcademic.syllabus = dataAny.syllabus as string;
          
          if (dataAny.academicDetails) {
              Object.assign(newAcademic, dataAny.academicDetails);
          }
          
          updateDataFlat.academicDetails = newAcademic as AcademicDetails;

          // RESOLVE gradeId if grade (name) and syllabus are available
          const gradeName = (dataAny.grade || newAcademic.grade) as string;
          const syllabus = (dataAny.syllabus || newAcademic.syllabus) as string;

          if (gradeName && syllabus) {
            try {
              const grade = await this.gradeRepo.findOne({
                name: gradeName,
                syllabus: syllabus.toUpperCase() as "CBSE" | "STATE" | "ICSE",
                isActive: true
              });
              if (grade) {
                updateDataFlat.gradeId = grade._id as any;
                logger.info(`Resolved gradeId: ${grade._id} for Grade: ${gradeName}, Syllabus: ${syllabus}`);
              } else {
                logger.warn(`Could not resolve gradeId for Grade: ${gradeName}, Syllabus: ${syllabus}`);
              }
            } catch (error) {
              logger.error(`Error resolving gradeId: ${error}`);
            }
          }
      }

      // 1. Contact Info & Parent Info
      if (dataAny.address !== undefined || dataAny.country !== undefined || dataAny.postalCode !== undefined ||
          dataAny.parentName !== undefined || dataAny.parentEmail !== undefined || dataAny.parentPhone !== undefined ||
          dataAny.relationship !== undefined || dataAny.contactInfo !== undefined) {
        
        const existingContact = (updateDataFlat.contactInfo as contactInfo | undefined) || {} as contactInfo;
        const existingParent = existingContact.parentInfo || {} as ParentInfo;

        const newParentInfo: Partial<ParentInfo> = { ...existingParent };
        if (dataAny.parentName !== undefined) newParentInfo.name = dataAny.parentName as string;
        if (dataAny.parentEmail !== undefined) newParentInfo.email = dataAny.parentEmail as string;
        if (dataAny.parentPhone !== undefined) newParentInfo.phoneNumber = dataAny.parentPhone as string;
        if (dataAny.relationship !== undefined) newParentInfo.relationship = dataAny.relationship as string;

        const newContactInfo: Partial<contactInfo> = { ...existingContact };
        if (dataAny.address !== undefined) newContactInfo.address = dataAny.address as string;
        if (dataAny.country !== undefined) newContactInfo.country = dataAny.country as string;
        if (dataAny.postalCode !== undefined) newContactInfo.postalCode = dataAny.postalCode as string;
        
        newContactInfo.parentInfo = newParentInfo as ParentInfo;
        updateDataFlat.contactInfo = newContactInfo as contactInfo;
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

  private async handleProfilePictureUpload(file: unknown): Promise<string> {
    const f = file as { originalname: string; mimetype: string; size: number; buffer: Buffer };
    try {
      logger.debug("Handling profile picture upload:", {
        originalname: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
      });

      if (!f) throw new Error("No file provided for profile picture");

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
      const currentStatus = (studentProfile.onboardingStatus || StudentOnboardingStatus.REGISTERED) as StudentOnboardingStatus;
      const newStatus = StudentOnboardingPolicy.getStatusForEvent(event) as StudentOnboardingStatus;

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

  async updatePreferences(studentId: string, preferences: Array<{ subjectId: string; slots: Array<{ day: string; startTime: string }> }>): Promise<StudentProfile> {
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
      
      // 2. Validate slots per subject and plan constraints
      const allSelectedSlots: { day: string; startTime: string }[] = [];
      const isBasic = studentProfile.subscription?.planCode === 'BASIC' || studentProfile.subscription?.planType === 'basic';

      preferences.forEach(pref => {
        if (!pref.slots || pref.slots.length === 0) {
          throw new AppError(`Subject ${pref.subjectId} must have at least one time slot`, HttpStatusCode.BAD_REQUEST);
        }

        // Basic Plan Constraint: Exactly 2 sessions (one Sat, one Sun)
        if (isBasic) {
           if (pref.slots.length !== 2) {
             throw new AppError(`Basic Plan requires exactly 2 shifts per subject (one for Saturday and one for Sunday).`, HttpStatusCode.BAD_REQUEST);
           }
           const hasSat = pref.slots.some((s) => s.day === 'Saturday');
           const hasSun = pref.slots.some((s) => s.day === 'Sunday');
           if (!hasSat || !hasSun) {
             throw new AppError(`Basic Plan requires one shift on Saturday and one on Sunday.`, HttpStatusCode.BAD_REQUEST);
           }
        }

        pref.slots.forEach((slot) => {
          // Holiday constraint for Basic Plan (Redundant but safe)
          if (isBasic && !['Saturday', 'Sunday'].includes(slot.day)) {
            throw new AppError("Basic plan sessions are only allowed on holidays (Saturday and Sunday)", HttpStatusCode.BAD_REQUEST);
          }

          // Validate Shift Values (MORNING/AFTERNOON) or Time Formats
          const isShift = ['MORNING', 'AFTERNOON', 'FLEXIBLE'].includes(slot.startTime);
          
          // Cross-subject overlap check (simplified for shifts)
          const hasOverlap = allSelectedSlots.some(s => s.day === slot.day && s.startTime === slot.startTime);
          if (hasOverlap && isShift) {
            throw new AppError(`Shift ${slot.day} ${slot.startTime} is selected for multiple subjects. Please pick distinct shifts.`, HttpStatusCode.BAD_REQUEST);
          }
          
          allSelectedSlots.push({ day: slot.day, startTime: slot.startTime });
        });
      });
      
      // 3. Update profile
      const updateData: Partial<StudentProfile> = {
        preferredSubjects: preferences.map(p => p.subjectId) as any,
        preferredTimeSlots: preferences as any,
        preferencesCompleted: true
      };
      
      const updatedStudent = await this.studentRepo.updateProfile(studentId, updateData);
      
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
          const subjectDoc = await this.subjectRepo.findById(validSubId);
          
          // Upsert CourseRequest: one per student per subject
          const existingRequest = await this.courseRequestRepo.findOne({
            student: studentId as any,
            subjectId: validSubId as any,
            status: { $in: ['pending', 'approved', 'reviewed'] }
          }) || await this.courseRequestRepo.findOne({ // Fallback to name search for legacy requests
            student: studentId as any,
            subject: subjectDoc?.subjectName || pref.subjectId,
            status: { $in: ['pending', 'approved', 'reviewed'] }
          });

          const requestData: Record<string, unknown> = {
            student: studentId as any,
            subject: subjectDoc?.subjectName || pref.subjectId,
            subjectId: validSubId as any,
            grade: (studentProfile.gradeId as any)?.name || studentProfile.academicDetails?.grade || 'N/A',
            syllabus: subjectDoc?.syllabus || studentProfile.academicDetails?.syllabus,
            mentoringMode: 'group',
            status: 'pending',
            preferredDays: pref.slots.map(s => s.day),
            timeSlot: pref.slots[0]?.startTime, 
            timezone: studentProfile.contactInfo?.address || 'UTC' // Falling back to address if timezone not in profile
          };

          if (validGradeId) {
              requestData.gradeId = validGradeId as any;
          }

          if (existingRequest) {
            await this.courseRequestRepo.updateById((existingRequest as any)._id, requestData);
          } else {
            await this.courseRequestRepo.create(requestData);
          }
        }
      }

      // 5. Advance onboarding
      try {
        await this.advanceOnboarding(studentId, 'PREFERENCES_COMPLETED' as any);
      } catch (e) {
        logger.warn(`Failed to advance onboarding to PREFERENCES_COMPLETED for ${studentId}`, { error: getErrorMessage(e) });
      }

      // 5. Notifications via events
      const studentName = (updatedStudent as any)?.fullName || "Student";
      this.eventEmitter.emit(EVENTS.PREFERENCES_SUBMITTED, {
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

      const student = await this.studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);


      // 1. Check for existing pending request
      const existingRequest = await this.mentorRequestRepo.findOne({
        studentId: studentId as any,
        subjectId: subjectId as any,
        status: 'pending'
      });

      if (existingRequest) {
        throw new AppError("You already have a pending mentor request for this subject.", HttpStatusCode.CONFLICT);
      }

      // 2. Update Student Preferred Time Slot Status
      const studentProfile = student as StudentProfile;
      const subjectPreferenceIndex = studentProfile.preferredTimeSlots?.findIndex(
        (slot: any) => slot.subjectId.toString() === subjectId || (slot.subjectId as any)._id?.toString() === subjectId
      );

      if (
        subjectPreferenceIndex === undefined || subjectPreferenceIndex === -1
      ) {
        throw new AppError("Preferences not found for this subject. Please submit preferences first.", HttpStatusCode.BAD_REQUEST);
      }

      // We need to use updateOne directly to target the specific array element
      await this.studentRepo.updateProfile(studentId, {
        [`preferredTimeSlots.${subjectPreferenceIndex}.status`]: 'mentor_requested'
      } as Partial<StudentProfile>);

      // 3. Create MentorAssignmentRequest
      await this.mentorRequestRepo.create({
        studentId: studentId as any,
        subjectId: subjectId as any,
        mentorId: mentorId as any,
        status: 'pending'
      });

      // 4. Send Notification via event
      this.eventEmitter.emit(EVENTS.MENTOR_REQUEST_SUBMITTED, {
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
      
      const student = await this.studentRepo.findStudentProfileById(studentId);
      if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
      
      const studentProfile = student as StudentProfile;
      const planSubjectCount = studentProfile.subscription?.subjectCount || 1;
      
      if (!subjectIds || subjectIds.length === 0) {
        throw new AppError("At least one subject must be selected", HttpStatusCode.BAD_REQUEST);
      }
      if (subjectIds.length > planSubjectCount) {
        throw new AppError(`You can select up to ${planSubjectCount} subjects based on your plan`, HttpStatusCode.BAD_REQUEST);
      }

      // Process each subject
      for (const subjectId of subjectIds) {
        // 1. Search for existing group course with capacity
        const maxGroupSize = PLAN_LIMITS[PlanType.BASIC].maxGroupSize;
        
        const existingGroup = await this.courseRepo.findOne({
          subject: subjectId,
          courseType: 'group',
          status: 'available',
          enrolledStudents: { $lt: maxGroupSize },
          isActive: true,
          // Optimization: Check for grade as well if student's grade is known
          grade: studentProfile.gradeId || studentProfile.academicDetails?.grade
        } as any);

        if (existingGroup) {
          logger.info(`Found existing group course ${existingGroup._id}. Enrolling student ${studentId}`);
          await this.enrollmentService.enrollInCourse(studentId, (existingGroup as any)._id.toString());
          
          // Increment enrolledStudents count
          await this.courseRepo.updateCourse((existingGroup as any)._id.toString(), { 
            $inc: { enrolledStudents: 1 } 
          } as any);

          // Emit notification event for mentor
          this.eventEmitter.emit(EVENTS.MENTOR_STUDENT_ASSIGNED, {
            studentId,
            studentName: studentProfile.fullName,
            courseId: (existingGroup as any)._id.toString(),
            mentorId: (existingGroup as any).mentor?.toString()
          });
        } else {
          logger.info(`No existing group found for subject ${subjectId}. Creating Admin request.`);
          // 3. Create CourseRequest for Admin
          const gradeVal = studentProfile.gradeId || studentProfile.academicDetails?.grade;
          const finalGradeId = (gradeVal && typeof gradeVal === 'object' && '_id' in gradeVal) ? (gradeVal as any)._id.toString() : gradeVal;

          await this.courseRequestRepo.create({
            student: studentId as any,
            subject: subjectId,
            grade: finalGradeId as any,
            mentoringMode: 'group',
            status: 'pending',
            preferredDays: [], // Flexible
            timeSlot: "FLEXIBLE",    // Flexible
            timezone: studentProfile.contactInfo?.address || 'UTC' // Falling back to address or timezone if available
          });

          // Notify Admin
          this.eventEmitter.emit(EVENTS.PREFERENCES_SUBMITTED, {
            studentId,
            studentName: studentProfile.fullName,
            subjectId,
            adminId: "SYSTEM_ADMIN"
          });
        }
      }

      // Advance onboarding
      try {
        await this.advanceOnboarding(studentId, 'PREFERENCES_COMPLETED' as any);
      } catch (e) {
        logger.warn(`Failed to advance onboarding to PREFERENCES_COMPLETED for ${studentId}`, { error: getErrorMessage(e) });
      }

      // Set preferencesCompleted flag
      const updateData: Partial<StudentProfile> = {
        preferredSubjects: subjectIds as any,
        preferencesCompleted: true
      };
      
      return await this.studentRepo.updateProfile(studentId, updateData) as StudentProfile;

    } catch (error: unknown) {
      logger.error(`Error updating basic preferences for student ${studentId}`, { error: getErrorMessage(error) });
      throw error;
    }
  }
}


