import type {
  StudentDBInput,
  StudentProfile,
  StudentRegisterInput,
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

  static toResponseDto(student: any): StudentProfile {
    const data = student.toObject ? student.toObject() : student;

    return {
      _id: data._id,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      age: data.age,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      contactInfo: data.contactInfo,
      academicDetails: data.academicDetails,
      profileImage: data.profileImage, // This might be the key now
      profileImageKey: data.profileImageKey,
      profileImageUrl: data.profileImageUrl, // The signed URL
      goal: data.goal,
      isVerified: data.isVerified,
      isBlocked: data.isBlocked,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      hasPaid: data.hasPaid,
      authProvider: data.authProvider,
      googleId: data.googleId,
    };
  }

  static toProfileUpdate(
    data: Partial<StudentProfile> & Record<string, any>
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
         name: data.parentName || data.contactInfo?.parentInfo?.name,
         email: data.parentEmail || data.contactInfo?.parentInfo?.email,
         phoneNumber: data.parentPhone || data.contactInfo?.parentInfo?.phoneNumber
      };

      updateData.contactInfo = {
        address: data.address || data.contactInfo?.address || '',
        country: data.country || data.contactInfo?.country || '',
        postalCode: data.postalCode || data.contactInfo?.postalCode || '',
        parentInfo: parentInfo
      } as any;
    } else if (data.contactInfo) {
      updateData.contactInfo = data.contactInfo;
    }

    // 2. Academic Details
    // Map 'grade' from frontend to 'gradeId' in backend interface
    if (data.institution || data.institutionName || data.grade || data.gradeId || data.syllabus) {
      updateData.academicDetails = {
        institutionName: data.institution || data.institutionName || data.academicDetails?.institutionName || '',
        gradeId: (data.grade || data.gradeId || data.academicDetails?.gradeId) as any, // Cast because it might be string pending conversion
        syllabus: data.syllabus || data.academicDetails?.syllabus || ''
      };
    } else if (data.academicDetails) {
      updateData.academicDetails = data.academicDetails;
    }

    // 3. Learning Goal
    if (data.learningGoal) {
        updateData.goal = data.learningGoal;
    }
    if (data.goal !== undefined) updateData.goal = data.goal;
    
    // Handle profile image key
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;
    if (data.profileImageKey !== undefined) updateData.profileImageKey = data.profileImageKey;

    return updateData;
  }

  
  static toStudentAuthUser(student: any): StudentAuthUser {
    return {
      _id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      password: student.password || "",
      phoneNumber: student.phoneNumber,
      role: "student",
      isVerified: student.isVerified ?? false,
      isProfileComplete: student.isProfileComplete || false,
      approvalStatus: student.approvalStatus || "approved",
      isBlocked: student.isBlocked || false,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,

      
      isPaid: student.isPaid || false,
      gradeLevel: student.gradeLevel,
      school: student.school,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
    };
  }

  static toStudentResponseDto(student: any): StudentBaseResponseDto {
    return {
      _id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      phoneNumber: student.phoneNumber,
      role: student.role,
      isVerified: student.isVerified,
      isProfileComplete: student.isProfileComplete || false,
      isPaid: student.isPaid || false,
      isBlocked: student.isBlocked || false, 
      approvalStatus: student.approvalStatus || "approved",
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,

      ...(student.gradeLevel && { gradeLevel: student.gradeLevel }),
      ...(student.school && { school: student.school }),
      ...(student.parentName && { parentName: student.parentName }),
      ...(student.parentPhone && { parentPhone: student.parentPhone }),
    };
  }

  static toSafeUpdateData(data: Partial<StudentBaseResponseDto>): Partial<StudentAuthUser> {
  const updateData: Partial<StudentAuthUser> = {};

  
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
  if (data.isPaid !== undefined) updateData.isPaid = data.isPaid;
  if (data.isBlocked !== undefined) updateData.isBlocked = data.isBlocked;
  if (data.isProfileComplete !== undefined) updateData.isProfileComplete = data.isProfileComplete;


  Object.keys(updateData).forEach(key => {
    if ((updateData as any)[key] === undefined) {
      delete (updateData as any)[key];
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

