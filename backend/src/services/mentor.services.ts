import { MentorRepository } from "../repositories/mentor.repository";
import type { AuthUser } from "../interfaces/auth.interface";

export class MentorService {
    constructor(private mentorRepo: MentorRepository){}

    async registerMentor(data: AuthUser): Promise<AuthUser> {
        const verified = await this.mentorRepo.findUserByEmail(data.email);
        if(verified) {
            throw new Error('Mentor already exists');
        }

        const mentor = await this.mentorRepo.createUser(data);
        return mentor;
   }
}  