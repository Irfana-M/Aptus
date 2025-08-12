import { StudentRepository } from "../repositories/student.repository.js";
import type { AuthUser } from "../interfaces/auth.interface.js";

export class StudentService {
    constructor(private studentRepo: StudentRepository){}

    async registerStudent(data: AuthUser): Promise<AuthUser> {
        const existing = await this.studentRepo.findUserByEmail(data.email);
        if(existing){
            throw new Error("Student already exist");
        }

        const student = await this.studentRepo.createUser(data);
        return student;
}
}