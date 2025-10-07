import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
    
export class MentorService {
    constructor(private _mentorRepo: IMentorRepository){}
    async registerMentor(data: AuthUser): Promise<AuthUser> {
        const verified = await this._mentorRepo.findByEmail(data.email);
        if(verified) {
            throw new Error('Mentor already exists');
        }

        const mentor = await this._mentorRepo.createUser(data);
        return mentor;
   }
}
    
