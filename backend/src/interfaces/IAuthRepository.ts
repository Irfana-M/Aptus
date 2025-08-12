import type { AuthUser } from "./auth.interface";
import type { RegisterUserDto } from "../dto/RegisteruserDTO";
import type { LoginUserDto } from "../dto/LoginUserDTO";
export interface IAuthRepository {
    findUserByEmail(email: string): Promise<AuthUser | null>;
    createUser(data: RegisterUserDto): Promise<AuthUser>;
    findById(id: string): Promise<AuthUser | null>;
    updatePassword(email: string, hashedPassword: string): Promise<void>;
    block(id: string): Promise<boolean>;
    markUserVerified(email: string): Promise<void>;
}