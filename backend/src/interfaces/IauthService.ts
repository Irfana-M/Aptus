import type { AuthUser } from "./auth.interface";
export interface IAuthService<AuthUser> {
    findByEmail(email: string): Promise<AuthUser | null>
    findById(id: string): Promise<AuthUser | null>
    updateProfile(id: string, data: Partial<AuthUser>): Promise<AuthUser | null>;
    block(id:string): Promise<boolean>;
}