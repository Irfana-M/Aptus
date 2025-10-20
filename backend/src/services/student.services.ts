import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import { logger } from "../utils/logger.js";
import { HttpStatusCode } from "../constants/httpStatus.js";

export class StudentService {
  constructor(private studentRepo: IStudentRepository) {}

  async registerStudent(data: AuthUser): Promise<AuthUser> {
    try {
      const existing = await this.studentRepo.findByEmail(data.email);
      if (existing) {
        logger.warn(`Attempted to register existing student: ${data.email}`);
        const error = new Error("Student already exists");
        (error as any).statusCode = HttpStatusCode.BAD_REQUEST;
        throw error;
      }

      const student = await this.studentRepo.createUser(data);
      logger.info(`Student registered successfully: ${student.email}`);
      return student;
    } catch (error: any) {
      logger.error(`Student registration failed for ${data.email}: ${error.message}`);
      throw error;
    }
  }
}
