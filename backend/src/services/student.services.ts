import { injectable, inject } from 'inversify';
import type { IStudentService } from "../interfaces/services/IStudentService";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type { AuthUser } from "../interfaces/auth/auth.interface";
import { logger } from "../utils/logger";
import { HttpStatusCode } from "../constants/httpStatus";
import { TYPES } from '../types';

@injectable()
export class StudentService implements IStudentService {
  constructor(
    @inject(TYPES.IStudentRepository) private studentRepo: IStudentRepository
  ) {}

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
      logger.error(
        `Student registration failed for ${data.email}: ${error.message}`
      );
      throw error;
    }
  }

  async findStudentByEmail(email: string): Promise<any> {
    try {
      logger.debug(`Finding student by email: ${email}`);
      return await this.studentRepo.findByEmail(email);
    } catch (error: any) {
      logger.error(`Error finding student by email ${email}`, { error: error.message });
      throw error;
    }
  }

  async createStudent(studentData: any): Promise<any> {
    try {
      logger.info(`Creating student: ${studentData.email}`);
      const student = await this.studentRepo.createUser(studentData);
      logger.info(`Student created successfully: ${student.email}`);
      return student;
    } catch (error: any) {
      logger.error(`Error creating student ${studentData.email}`, { error: error.message });
      throw error;
    }
  }
}

  
