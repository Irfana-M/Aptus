import type { AuthUser } from "../auth/auth.interface.js";

export interface IVerificationRepository<T extends AuthUser = AuthUser> {
  markUserVerified(email: string): Promise<void>;
  findByEmail(email: string): Promise<T | null>;
}