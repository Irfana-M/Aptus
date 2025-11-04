import type { AuthUser } from "../auth/auth.interface";

export interface IVerificationRepository<T extends AuthUser = AuthUser> {
  markUserVerified(email: string): Promise<void>;
  findByEmail(email: string): Promise<T | null>;
}