import type { MentorProfile } from "./mentor.interface";

export interface IMentorRepository {
    findByEmail(email: string): Promise<MentorProfile | null>;
    findById(id: string): Promise<MentorProfile | null>;
    updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null>;
    updateVerificationStatus(id: string, isVerified: boolean, reason?: string): Promise<MentorProfile | null>;
    listAllMentor(): Promise<MentorProfile[]>;
    blockMenotr(id: string): Promise<boolean>; 
    markUserVerified(email: string): Promise<void>;
}