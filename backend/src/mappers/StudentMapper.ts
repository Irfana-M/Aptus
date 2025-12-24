import type {
  StudentDBInput,
  StudentProfile,
  StudentRegisterInput,
  SubscriptionDetails,
} from "@/interfaces/models/student.interface";
import type {
  StudentAuthUser,
  AuthUser,
} from "@/interfaces/auth/auth.interface";
import type { StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";

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
    };
  }

  static toProfileUpdate(
    data: Partial<StudentProfile> & Record<string, unknown>
  ): Partial<StudentProfile> {
    const updateData: Partial<StudentProfile> = {};

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth;
    
    // Map flat input fields to nested schema structure
    // 1. Contact Info & Parent Info
    if (data.address || data.country || data.postalCode || 
        data.parentName || data.parentEmail || data.parentPhone) {
      
      const parentInfo = {
         name: (data.parentName as string) || data.contactInfo?.parentInfo?.name || '',
         email: (data.parentEmail as string) || data.contactInfo?.parentInfo?.email || '',
         phoneNumber: (data.parentPhone as string) || data.contactInfo?.parentInfo?.phoneNumber || '',
         relationship: (data.relationship as string) || data.contactInfo?.parentInfo?.relationship || ''
      };

      updateData.contactInfo = {
        address: (data.address as string) || data.contactInfo?.address || '',
        country: (data.country as string) || data.contactInfo?.country || '',
        postalCode: (data.postalCode as string) || data.contactInfo?.postalCode || '',
        parentInfo: parentInfo
      };
    } else if (data.contactInfo) {
      updateData.contactInfo = data.contactInfo;
    }

    // 2. Academic Details
    // Map 'grade' from frontend to 'gradeId' in backend interface
    if (data.institution || data.institutionName || data.grade || data.gradeId || data.syllabus) {
      updateData.academicDetails = {
        institutionName: (data.institution as string) || (data.institutionName as string) || data.academicDetails?.institutionName || '',
        grade: (data.grade as string) || data.academicDetails?.grade || '',
        syllabus: (data.syllabus as string) || data.academicDetails?.syllabus || ''
      };
    } else if (data.academicDetails) {
      updateData.academicDetails = data.academicDetails;
    }

    // 3. Learning Goal
    if (data.learningGoal) {
        updateData.goal = data.learningGoal as string;
    }
    if (data.goal !== undefined) updateData.goal = data.goal;
    
    // Handle profile image key
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
    if (data.profileImageKey !== undefined) updateData.profileImageKey = data.profileImageKey as string;

    return updateData;
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
      isProfileComplete: s.isProfileComplete || false,
      approvalStatus: "approved",
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
      isProfileComplete: s.isProfileComplete || false,
      subscription: s.subscription as SubscriptionDetails | undefined,
      gradeLevel: s.academicDetails?.grade || s.gradeLevel || "",
      school: s.academicDetails?.institutionName || s.school || "",
      parentName: s.contactInfo?.parentInfo?.name || s.parentName || "",
      parentPhone: s.contactInfo?.parentInfo?.phoneNumber || s.parentPhone || "",
      relationship: s.contactInfo?.parentInfo?.relationship || s.relationship || "",
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

