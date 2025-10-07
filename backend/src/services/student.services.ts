import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";

export class StudentService {
    constructor(private studentRepo: IStudentRepository){}

    async registerStudent(data: AuthUser): Promise<AuthUser> {
        const existing = await this.studentRepo.findByEmail(data.email);
        if(existing){
            throw new Error("Student already exist");
        }

        const student = await this.studentRepo.createUser(data);
        return student;
}
}
