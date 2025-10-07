import type { AuthUser } from "../auth/auth.interface.js";

export interface IVerificationRepository {
    markUserVerified(email: string): Promise<void>;
    findByEmail(email: string): Promise<AuthUser | null>; 
}