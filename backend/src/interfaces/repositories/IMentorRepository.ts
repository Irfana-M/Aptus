import type { AuthUser } from "../auth/auth.interface.js";
import type { MentorProfile } from "../models/mentor.interface.js";

export interface IMentorAuthRepository {
    findByEmail(email: string): Promise<AuthUser | null>;
    comparePasswords(user: AuthUser, password: string): Promise<boolean>;
    createUser(data: AuthUser): Promise<AuthUser>;
    markUserVerified(email: string): Promise<void>;
    updatePassword(email: string, hashedPassword: string): Promise<void>;
    //updateVerificationStatus(id: string, isVerified: boolean, reason?: string): Promise<MentorProfile | null>;
}

export interface IMentorRepository {
    findById(id: string): Promise<MentorProfile | null>;
    updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null>;
    submitForApproval(id: string): Promise<MentorProfile>;
    getPendingApprovals(): Promise<MentorProfile[]>;
    updateApprovalStatus(id: string, status: "approved" | "rejected", rejectionReason?: string): Promise<MentorProfile | null>;
    //listAllMentor(): Promise<MentorProfile[]>;
    //blockMentor(id: string): Promise<boolean>;
   
}