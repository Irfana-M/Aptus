import type { AuthUser } from "../auth/auth.interface.js";
import type { MentorProfile } from "../models/mentor.interface.js";

export interface IMentorRepository {
    findByEmail(email: string): Promise<AuthUser | null>;
    comparePasswords(data: AuthUser, password: string): Promise<boolean>;
    findById(id: string): Promise<AuthUser | null>;
    updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null>;
    updateVerificationStatus(id: string, isVerified: boolean, reason?: string): Promise<MentorProfile | null>;
    listAllMentor(): Promise<MentorProfile[]>;
    blockMentor(id: string): Promise<boolean>; 
    markUserVerified(email: string): Promise<void>;
    createUser(data: AuthUser): Promise<AuthUser>;
}