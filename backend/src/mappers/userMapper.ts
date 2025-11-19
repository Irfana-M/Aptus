import type {
  AuthUser,
  MentorAuthUser,
  StudentAuthUser,
} from "../interfaces/auth/auth.interface";
import type {
  MentorBaseResponseDto,
  StudentBaseResponseDto,
} from "../dto/auth/UserResponseDTO";

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
      isPaid: user.isPaid ?? false,
    };
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
    };
  }
}
