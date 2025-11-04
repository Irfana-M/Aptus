import type { AuthUser } from "./auth.interface";
import type { RegisterUserDto } from "../../dto/auth/RegisteruserDTO";
export interface IAuthRepository<T extends AuthUser = AuthUser> {
  findByEmail(email: string): Promise<T | null>;
  createUser(data: RegisterUserDto): Promise<T>;
  findById(id: string): Promise<T | null>;
  block(id: string): Promise<boolean>;
  markUserVerified(email: string): Promise<void>;
}
