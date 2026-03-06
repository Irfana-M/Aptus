import type {
  AuthUser,
  MentorAuthUser,
  StudentAuthUser,
} from "../interfaces/auth/auth.interface.js";
import type { MentorBaseResponseDto, StudentBaseResponseDto } from "../dtos/auth/UserResponseDTO.js";

export class UserMapper {
  static toMentorResponseDto(user: MentorAuthUser): MentorBaseResponseDto {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete ?? false,
      approvalStatus: user.approvalStatus ?? "pending",
    };
  }

  static toStudentResponseDto(user: StudentAuthUser): StudentBaseResponseDto {
    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete ?? true,
      isPaid: (user as unknown as { isPaid?: boolean }).isPaid ?? false,
      hasPaid: (user as unknown as { isPaid?: boolean }).isPaid ?? false,
      isTrialCompleted: user.isTrialCompleted ?? false,
    } as StudentBaseResponseDto;
  }

  static toAuthUser(user: AuthUser): AuthUser {
    return {
      _id: user._id,
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      isProfileComplete: user.isProfileComplete ?? true,
      approvalStatus: user.approvalStatus ?? "pending",
      isBlocked: user.isBlocked ?? false,
      createdAt: user.createdAt ?? new Date(),
      updatedAt: user.updatedAt ?? new Date(),
    };
  }

  static toLoginAuthUser(
    user: MentorAuthUser | StudentAuthUser,
    isProfileComplete: boolean
  ): AuthUser {
    return {
      _id: user._id,
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      password: user.password,
      phoneNumber: user.phoneNumber,
      role: user.role,
      isVerified: user.isVerified,
      isProfileComplete: isProfileComplete,
      approvalStatus: user.approvalStatus ?? "pending",
      // Include student-specific fields if they exist
      ...((user.role === 'student') ? {
        isPaid: (user as StudentAuthUser).isPaid ?? false,
        hasPaid: (user as StudentAuthUser).isPaid ?? false,
        isTrialCompleted: (user as StudentAuthUser).isTrialCompleted ?? false,
        onboardingStatus: (user as StudentAuthUser).onboardingStatus,
        profileImageUrl: (user as StudentAuthUser).profileImageUrl,
        profileImage: (user as StudentAuthUser).profileImage,
      } : {
        profileImageUrl: (user as MentorAuthUser).profileImageUrl,
        profilePicture: (user as MentorAuthUser).profilePicture,
      })
    };
  }
}
