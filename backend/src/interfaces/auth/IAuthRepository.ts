import type { AuthUser } from "./auth.interface";
import type { RegisterUserDto } from "../../dto/auth/RegisteruserDTO";
export interface IAuthRepository<T extends AuthUser = AuthUser> {
  findByEmail(email: string): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  createUser(data: RegisterUserDto): Promise<T>; 
  markUserVerified(email: string): Promise<void>;
  block(id: string): Promise<T>;
  unblock(id: string): Promise<T>;
}
