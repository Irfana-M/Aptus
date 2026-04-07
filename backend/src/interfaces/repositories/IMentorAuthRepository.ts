import type { AuthUser, MentorAuthUser } from "../auth/auth.interface";
import type { IAuthRepository } from "../auth/IAuthRepository";
import type { MentorProfile } from "../models/mentor.interface";

export interface IMentorAuthRepository extends IAuthRepository<MentorAuthUser> {
  updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null>;
  updateVerificationStatus(id: string, isVerified: boolean, reason?: string): Promise<MentorProfile | null>;
  blockMentor(id: string): Promise<boolean>;
  listAllMentor(): Promise<MentorProfile[]>;
  comparePasswords(user: AuthUser, password: string): Promise<boolean>;
}