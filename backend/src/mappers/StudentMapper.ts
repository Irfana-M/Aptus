import type {
  StudentDBInput,
  StudentProfile,
  StudentRegisterInput,
  SubscriptionDetails,
  ParentInfo,
  contactInfo,
  AcademicDetails
} from "../interfaces/models/student.interface.js";
import type {
  StudentAuthUser,
  AuthUser,
} from "../interfaces/auth/auth.interface.js";
import type { StudentBaseResponseDto } from "../dtos/auth/UserResponseDTO.js";
import { StudentOnboardingStatus } from "../enums/studentOnboarding.enum.js";
import { ApprovalStatus } from "../domain/enums/ApprovalStatus.js";
import { Types } from "mongoose";


export class StudentMapper {

  static toDBInput(input: StudentRegisterInput): StudentDBInput {
    return {
      fullName: input.fullName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      password: input.password,
      isBlocked: false,
    };
  }

  static toResponseDto(student: StudentAuthUser | (StudentAuthUser & { toObject: () => StudentAuthUser })): StudentProfile {
    const data = (student && 'toObject' in student && typeof student.toObject === 'function') 
      ? student.toObject() 
      : student as StudentAuthUser;

    return {
      _id: data._id,
      fullName: data.fullName || "",
      email: data.email || "",
      phoneNumber: data.phoneNumber || "",
      age: data.age,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      contactInfo: data.contactInfo,
      academicDetails: data.academicDetails,
      profileImage: data.profileImage || "",
      profileImageKey: data.profileImageKey || undefined,
      profileImageUrl: data.profileImageUrl || undefined,
      goal: data.goal || "",
      isVerified: data.isVerified ?? false,
      isBlocked: data.isBlocked ?? false,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      // Use actual hasPaid field from DB, fallback to subscription status check
      hasPaid: data.hasPaid ?? (data.subscription?.status === 'active'),
      isTrialCompleted: data.isTrialCompleted ?? false,
      isProfileCompleted: data.isProfileCompleted ?? false,
      subscription: data.subscription as SubscriptionDetails | undefined,
      authProvider: data.authProvider,
      googleId: data.googleId,
      gradeId: data.gradeId ? new Types.ObjectId(data.gradeId as string) : undefined,
      onboardingStatus: data.onboardingStatus,
      preferencesCompleted: data.preferencesCompleted as boolean | undefined,
      preferredSubjects: data.preferredSubjects?.map(id => new Types.ObjectId(id as string)),
      preferredTimeSlots: data.preferredTimeSlots?.map((slot) => ({
        subjectId: new Types.ObjectId(slot.subjectId as string),
        slots: slot.slots,
        status: (slot as unknown as { status?: string }).status as 'preferences_submitted' | 'mentor_requested' | 'mentor_assigned' | 'active' | 'reassigned'
      })),
    };
  }

  static toProfileUpdate(
    data: Partial<StudentProfile> & Record<string, unknown>
  ): Partial<StudentProfile> {
    const updateData: Partial<StudentProfile> = {};

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.dateOfBirth !== undefined) {
        updateData.dateOfBirth = data.dateOfBirth;
        // Auto-calculate age if not provided
        if (data.age === undefined && data.dateOfBirth) {
            const dob = new Date(data.dateOfBirth);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }
            updateData.age = age;
        }
    }
    if (data.age !== undefined) updateData.age = data.age;
    if (data.gender !== undefined) updateData.gender = data.gender;
    
    // Map flat input fields to nested schema structure
    // Map flat input fields to nested schema structure
    // 1. Contact Info & Parent Info
    // Initialize contactInfo in updateData if any related field is present or if contactInfo is explicitly provided
    if (data.address !== undefined || data.country !== undefined || data.postalCode !== undefined || 
        data.parentName !== undefined || data.parentEmail !== undefined || data.parentPhone !== undefined || 
        data.relationship !== undefined || data.contactInfo !== undefined) {
      
      const existingContact = (updateData.contactInfo as contactInfo | undefined) || {} as contactInfo;
      const existingParent = existingContact.parentInfo || {} as ParentInfo;

      // We need to be careful not to overwrite with undefined/empty if not provided in a partial update
      // But we don't have the "existing" DB record here, only the input "data".
      // So we should only set keys that are defined in "data".
      
      const newParentInfo: Partial<ParentInfo> = { ...existingParent };
      if (data.parentName !== undefined) newParentInfo.name = data.parentName as string;
      if (data.parentEmail !== undefined) newParentInfo.email = data.parentEmail as string;
      if (data.parentPhone !== undefined) newParentInfo.phoneNumber = data.parentPhone as string;
      if (data.relationship !== undefined) newParentInfo.relationship = data.relationship as string;
      
      // If data.contactInfo.parentInfo exists, merge it too
      if (data.contactInfo?.parentInfo) {
          Object.assign(newParentInfo, data.contactInfo.parentInfo);
      }

      const newContactInfo: Partial<contactInfo> = { ...existingContact };
      if (data.address !== undefined) newContactInfo.address = data.address as string;
      if (data.country !== undefined) newContactInfo.country = data.country as string;
      if (data.postalCode !== undefined) newContactInfo.postalCode = data.postalCode as string;
      
      newContactInfo.parentInfo = newParentInfo as ParentInfo;
      updateData.contactInfo = newContactInfo as contactInfo;
      
      // If data.contactInfo exists (non-flattened), merge it
      if (data.contactInfo) {
           const { parentInfo: _parentInfo, ...rest } = data.contactInfo;
           Object.assign(newContactInfo, rest);
      }

      updateData.contactInfo = newContactInfo as contactInfo;
    }

    // 2. Academic Details
    if (data.institution !== undefined || data.institutionName !== undefined || 
        data.grade !== undefined || data.gradeId !== undefined || data.syllabus !== undefined ||
        data.academicDetails !== undefined) {
        
        const existingAcademic = updateData.academicDetails || {};
        const newAcademic: Partial<AcademicDetails> = { ...existingAcademic };

        if (data.institution !== undefined) newAcademic.institutionName = data.institution as string;
        if (data.institutionName !== undefined) newAcademic.institutionName = data.institutionName as string;
        if (data.grade !== undefined) newAcademic.grade = data.grade as string;
        if (data.syllabus !== undefined) newAcademic.syllabus = data.syllabus as string;
        
        if (data.academicDetails) {
            Object.assign(newAcademic, data.academicDetails);
        }
        
        updateData.academicDetails = newAcademic as AcademicDetails;
    }

    // 3. Learning Goal
    if (data.learningGoal) {
        updateData.goal = data.learningGoal as string;
    }
    if (data.goal !== undefined) updateData.goal = data.goal;
    
    // Handle profile image key
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
    if (data.profileImageKey !== undefined) updateData.profileImageKey = data.profileImageKey as string;

    // Explicitly allow status flags to be updated
    if (data.isProfileCompleted !== undefined) {
        updateData.isProfileCompleted = data.isProfileCompleted;
    }
    if (data.onboardingStatus !== undefined) {
        updateData.onboardingStatus = data.onboardingStatus;
    }

    return updateData;
  }

  /**
   * List of fields (dot-paths) required for a complete student profile.
   */
  static readonly REQUIRED_PROFILE_FIELDS = [
    "fullName",
    "email",
    "phoneNumber",
    "gender",
    "dateOfBirth",
    "age",
    "contactInfo.address",
    "contactInfo.country",
    "contactInfo.parentInfo.name",
    "contactInfo.parentInfo.phoneNumber",
    "contactInfo.parentInfo.relationship",
    "academicDetails.institutionName",
    "academicDetails.syllabus"
  ];

  /**
   * Transforms flat/nested profile data into a dot-notation object for safe Mongoose updates.
   * Priority: Nested > Flat. Omits undefined/null values. 
   * Protects required fields from being cleared (empty strings).
   */
  static toNestedUpdate(data: Partial<StudentProfile> & Record<string, unknown>): Record<string, unknown> {
    const update: Record<string, unknown> = {};

    // Helper to resolve value with Nested > Flat precedence
    const resolve = (nested: unknown, flat: unknown, path: string) => {
      const val = nested !== undefined ? nested : flat;
      if (val === undefined || val === null) return undefined;
      
      // Protect against corrupted [object Object] strings from frontend serialization
      if (typeof val === 'string' && val.includes('[object Object]')) {
        return undefined;
      }
      
      // Protect required fields from being accidentally cleared (data loss prevention)
      if (this.REQUIRED_PROFILE_FIELDS.includes(path) && val === "") return undefined;
      
      return val;
    };

    // 1. Top-level fields
    const fullName = resolve(undefined, data.fullName, "fullName");
    if (fullName) update.fullName = fullName;

    const email = resolve(undefined, data.email || data.emailId, "email");
    if (email) update.email = email;

    const phone = resolve(undefined, data.phoneNumber, "phoneNumber");
    if (phone) update.phoneNumber = phone;

    const age = resolve(undefined, data.age, "age");
    if (age !== undefined) update.age = age;

    const dob = resolve(undefined, data.dateOfBirth, "dateOfBirth");
    if (dob) update.dateOfBirth = dob;

    const gender = resolve(undefined, data.gender, "gender");
    if (gender) update.gender = gender;

    const goal = resolve(undefined, data.goal || data.learningGoal, "goal");
    if (goal) update.goal = goal;

    // 2. contactInfo (Nested > Flat)
    const address = resolve(data.contactInfo?.address, data.address, "contactInfo.address");
    if (address !== undefined) update["contactInfo.address"] = address;

    const country = resolve(data.contactInfo?.country, data.country, "contactInfo.country");
    if (country !== undefined) update["contactInfo.country"] = country;

    const postalCode = resolve(data.contactInfo?.postalCode, data.postalCode, "contactInfo.postalCode");
    if (postalCode !== undefined) update["contactInfo.postalCode"] = postalCode;

    // 3. parentInfo (Nested > Flat)
    const pName = resolve(data.contactInfo?.parentInfo?.name, data.parentName, "contactInfo.parentInfo.name");
    if (pName !== undefined) update["contactInfo.parentInfo.name"] = pName;

    const pEmail = resolve(data.contactInfo?.parentInfo?.email, data.parentEmail, "contactInfo.parentInfo.email");
    if (pEmail !== undefined) update["contactInfo.parentInfo.email"] = pEmail;

    const pPhone = resolve(data.contactInfo?.parentInfo?.phoneNumber, data.parentPhone, "contactInfo.parentInfo.phoneNumber");
    if (pPhone !== undefined) update["contactInfo.parentInfo.phoneNumber"] = pPhone;

    const pRel = resolve(data.contactInfo?.parentInfo?.relationship, data.relationship, "contactInfo.parentInfo.relationship");
    if (pRel !== undefined) update["contactInfo.parentInfo.relationship"] = pRel;

    // 4. academicDetails (Nested > Flat)
    const institution = resolve(data.academicDetails?.institutionName, data.institution || data.institutionName, "academicDetails.institutionName");
    if (institution !== undefined) update["academicDetails.institutionName"] = institution;

    const grade = resolve(data.academicDetails?.grade, data.grade, "academicDetails.grade");
    if (grade !== undefined) update["academicDetails.grade"] = grade;

    const syllabus = resolve(data.academicDetails?.syllabus, data.syllabus, "academicDetails.syllabus");
    if (syllabus !== undefined) update["academicDetails.syllabus"] = syllabus;

    // 5. Metadata & Flags
    if (data.profileImage) update.profileImage = data.profileImage;
    if (data.profileImageKey) update.profileImageKey = data.profileImageKey;
    if (data.onboardingStatus) update.onboardingStatus = data.onboardingStatus;
    if (data.isProfileCompleted !== undefined) update.isProfileCompleted = data.isProfileCompleted;

    return update;
  }

  /**
   * Evaluates if a profile object is complete based on REQUIRED_PROFILE_FIELDS.
   */
  static calculateCompleteness(profile: any): boolean {
    if (!profile) return false;

    // Basic check for required fields using dot-path resolution
    const isBasicFieldsComplete = this.REQUIRED_PROFILE_FIELDS.every(path => {
      const parts = path.split('.');
      let val = profile;
      for (const part of parts) {
        if (val === null || val === undefined) return false;
        val = val[part];
      }
      return val !== null && val !== undefined && val !== "";
    });

    // Special check for grade (either gradeId or academicDetails.grade)
    const hasGrade = !!(profile.gradeId || profile.academicDetails?.grade);

    return isBasicFieldsComplete && hasGrade;
  }

  /**
   * Merges a dot-notation update object into a base object.
   */
  static applyDottedUpdate(base: any, update: Record<string, any>): any {
    const result = JSON.parse(JSON.stringify(base || {})); // Deep clone for safety
    
    for (const [path, value] of Object.entries(update)) {
      const parts = path.split('.');
      let current: any = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (part) {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      }
      
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        current[lastPart] = value;
      }
    }
    
    return result;
  }


  
  static toStudentAuthUser(student: StudentAuthUser | (StudentAuthUser & { toObject: () => StudentAuthUser })): StudentAuthUser {
    const s = (student && 'toObject' in student && typeof student.toObject === 'function') 
      ? student.toObject() 
      : student as StudentAuthUser;

    return {
      _id: s._id.toString(),
      fullName: s.fullName,
      email: s.email,
      password: s.password || "",
      phoneNumber: s.phoneNumber || "",
      role: "student",
      isVerified: s.isVerified ?? false,
      isProfileComplete: s.isProfileCompleted || s.isProfileComplete || false,
      approvalStatus: ApprovalStatus.APPROVED,
      isBlocked: s.isBlocked || false,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      isPaid: s.isPaid || false,
      
      // Add missing profile fields
      age: s.age,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      contactInfo: s.contactInfo,
      academicDetails: s.academicDetails,
      goal: s.goal,

      gradeLevel: s.academicDetails?.grade || s.gradeLevel || "",
      school: s.academicDetails?.institutionName || s.school || "",
      parentName: s.contactInfo?.parentInfo?.name || s.parentName || "",
      parentPhone: s.contactInfo?.parentInfo?.phoneNumber || s.parentPhone || "",
      relationship: s.contactInfo?.parentInfo?.relationship || s.relationship || "",
      profileImage: s.profileImage || "",
      profileImageKey: s.profileImageKey || "",
      profileImageUrl: s.profileImageUrl,
      subscription: s.subscription as SubscriptionDetails | undefined,
      isTrialCompleted: s.isTrialCompleted || false,
      hasPaid: s.hasPaid ?? ((s.subscription?.status === 'active') || false),
      onboardingStatus: s.onboardingStatus || StudentOnboardingStatus.REGISTERED,
      gradeId: s.gradeId?.toString(),
      preferencesCompleted: s.preferencesCompleted,
      preferredSubjects: s.preferredSubjects?.map(id => {
        if (typeof id === 'object' && id !== null && (id as any).subjectName) {
            return id;
        }
        return id.toString();
      }),
      preferredTimeSlots: s.preferredTimeSlots?.map((slot) => ({
        subjectId: (slot.subjectId && typeof slot.subjectId === 'object' && (slot.subjectId as any).subjectName)
            ? slot.subjectId
            : slot.subjectId?.toString() || "",
        slots: slot.slots,
        status: (slot as unknown as { status?: string }).status || ""
      })),
    };
  }

  static toStudentResponseDto(student: StudentAuthUser | (StudentAuthUser & { toObject: () => StudentAuthUser })): StudentBaseResponseDto {
    const s = (student && 'toObject' in student && typeof student.toObject === 'function') 
      ? student.toObject() 
      : student as StudentAuthUser;
    
    return {
      id: s._id.toString(),
      fullName: s.fullName || "",
      email: s.email || "",
      phoneNumber: s.phoneNumber || "",
      role: s.role,
      isVerified: s.isVerified || false,
      isProfileComplete: s.isProfileCompleted || s.isProfileComplete || false,
      subscription: s.subscription as SubscriptionDetails | undefined,
      gradeLevel: s.academicDetails?.grade || s.gradeLevel || "",
      school: s.academicDetails?.institutionName || s.school || "",
      parentName: s.contactInfo?.parentInfo?.name || s.parentName || "",
      parentPhone: s.contactInfo?.parentInfo?.phoneNumber || s.parentPhone || "",
      relationship: s.contactInfo?.parentInfo?.relationship || s.relationship || "",
      isTrialCompleted: s.isTrialCompleted || false,
      totalTrialClasses: (s as unknown as { totalTrialClasses: number }).totalTrialClasses || 0,
      pendingTrialClasses: (s as unknown as { pendingTrialClasses: number }).pendingTrialClasses || 0,
      onboardingStatus: s.onboardingStatus,
      createdAt: s.createdAt || undefined,
    };
  }

  static toSafeUpdateData(data: Partial<StudentBaseResponseDto>): Partial<StudentAuthUser> {
  const updateData: Partial<StudentAuthUser> = {};

  
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;

  if (data.isBlocked !== undefined) updateData.isBlocked = data.isBlocked;
  if (data.isProfileComplete !== undefined) updateData.isProfileComplete = data.isProfileComplete;


  Object.keys(updateData).forEach(key => {
    if (updateData[key as keyof StudentAuthUser] === undefined) {
      delete updateData[key as keyof StudentAuthUser];
    }
  });
  
  return updateData;
}

  static toAuthUser(student: StudentAuthUser): AuthUser {
    return {
      _id: student._id,
      fullName: student.fullName,
      email: student.email,
      password: student.password,
      phoneNumber: student.phoneNumber,
      role: "student",
      isVerified: student.isVerified,
      isProfileComplete: student.isProfileComplete ?? false,
      approvalStatus: student.approvalStatus ?? "pending",
      isBlocked: student.isBlocked ?? false,
      createdAt: student.createdAt ?? new Date(),
      updatedAt: student.updatedAt ?? new Date(),
      subscription: student.subscription,
      isPaid: student.isPaid || false,
      isTrialCompleted: student.isTrialCompleted || false,
      hasPaid: student.hasPaid ?? (student.subscription?.status === 'active'),
      onboardingStatus: student.onboardingStatus as StudentOnboardingStatus | undefined,
      preferencesCompleted: student.preferencesCompleted as boolean | undefined,
    };
  }

  static isProfileComplete(data: Partial<StudentProfile | AuthUser>): boolean {
    const requiredFields = ["fullName", "email", "phoneNumber"];
    return requiredFields.every(
      (field) =>
        data[field as keyof typeof data] &&
        data[field as keyof typeof data] !== ""
    );
  }
}

