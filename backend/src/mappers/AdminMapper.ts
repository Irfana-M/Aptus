import type { IAdmin } from "../interfaces/models/admin.interface.js";
import type {
  AdminLoginResponseDto,
  AdminResponseDto,
} from "../dtos/admin/AdminLoginResponseDTO.js";

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
