import type { IAdmin } from "../interfaces/models/admin.interface";
import type {
  AdminLoginResponseDto,
  AdminResponseDto,
} from "@/dto/admin/AdminLoginResponseDTO";

export class AdminMapper {
  static toResponseDto(admin: IAdmin): AdminResponseDto {
    const adminData = admin.toObject ? admin.toObject() : admin;

    return {
      _id: adminData._id.toString(),
      email: admin.email,
      role: "admin",
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }

  static toLoginResponseDto(
    admin: IAdmin,
    accessToken: string,
    refreshToken: string
  ): AdminLoginResponseDto {
    return {
      admin: this.toResponseDto(admin),
      accessToken,
      refreshToken,
    };
  }
}
