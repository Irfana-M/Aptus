import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IUserRoleService } from "@/interfaces/services/IUserRoleSrvice";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type {  StudentBaseResponseDto } from "@/dto/auth/UserResponseDTO";
import type { MentorResponseDto } from "@/dto/mentor/MentorResponseDTO";
import { logger } from "../utils/logger";
import { TrialClassRepository } from "../repositories/trialClass.repository";
import { MentorMapper } from "@/mappers/MentorMapper";
import { StudentMapper } from "@/mappers/StudentMapper";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import type { IStudentService } from "@/interfaces/services/IStudentService";
import type { IMentorService } from "@/interfaces/services/IMentorService";

@injectable()
export class UserRoleService implements IUserRoleService {
  constructor(
    @inject(TYPES.IMentorRepository) private mentorRepository: IMentorRepository,
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository,
    @inject(TYPES.ITrialClassRepository) private trialClassRepository: ITrialClassRepository,
     @inject(TYPES.IStudentService) private studentService: IStudentService,
    @inject(TYPES.IMentorService) private mentorService: IMentorService
  ) {}

  

  async verifyUserRole(
    userId: string,
    role: "mentor" | "student"
  ): Promise<{ success: boolean; user?: MentorResponseDto | StudentBaseResponseDto; error?: string }> {
    try {
      if (role === "mentor") {
        const mentor = await this.mentorService.getById(userId);
        if (!mentor) return { success: false, error: "Mentor not found" };
        return { success: true, user: mentor };
      }

      if (role === "student") {
        const student = await this.studentService.getById(userId);
        if (!student) return { success: false, error: "Student not found" };
        return { success: true, user: student };
      }

      return { success: false, error: "Invalid role" };
    } catch (error) {
      return { success: false, error: "Database error" };
    }
  }

  public async getUserByIdAndRole(
    userId: string, 
    role: 'mentor' | 'student'
  ): Promise<MentorResponseDto | StudentBaseResponseDto | null> {
    try {
      if (role === 'mentor') {
        const mentor = await this.mentorRepository.findById(userId);
        if (!mentor) return null;
        
        return MentorMapper.toResponseDto(mentor);
      } 
      
      if (role === 'student') {
        const student = await this.studentRepository.findById(userId);
        if (!student) return null;
        
        return StudentMapper.toStudentResponseDto(student);
      }
      
      return null;
    } catch (error) {
      logger.error(`Error getting user ${userId} as ${role}:`, error);
      return null;
    }
  }

 
  public async verifyTrialClassAuthorization(
    trialClassId: string, 
    userId: string, 
    role: 'mentor' | 'student'
  ): Promise<{
    authorized: boolean;
    trialClass?: any;
    error?: string;
  }> {
    try {
      const trialClass = await this.trialClassRepository.findById(trialClassId);
      
      if (!trialClass) {
        return { 
          authorized: false, 
          error: 'Trial class not found' 
        };
      }
      
      let isAuthorized = false;
      
      
      const studentId = (trialClass.student as any)?._id 
        ? (trialClass.student as any)._id.toString() 
        : trialClass.student?.toString();
        
      const mentorId = (trialClass.mentor as any)?._id 
        ? (trialClass.mentor as any)._id.toString() 
        : trialClass.mentor?.toString();
      
      if (role === 'student') {
        isAuthorized = studentId === userId;
      } else if (role === 'mentor') {
        isAuthorized = mentorId === userId;
      }
      
      if (isAuthorized) {
        return { 
          authorized: true, 
          trialClass 
        };
      } else {
        const expectedId = role === 'student' ? studentId : mentorId;
        const errorMsg = `User not authorized. Req: ${userId} (${role}), Exp: ${expectedId}`;
        logger.warn(`❌ Auth Failed: ${errorMsg}`);
        return { 
          authorized: false, 
          error: errorMsg,
          trialClass: {
            _id: trialClass._id,
            status: trialClass.status,
            student: trialClass.student,
            mentor: trialClass.mentor
          }
        };
      }
    } catch (error) {
      logger.error('Error verifying trial class authorization:', error);
      return { authorized: false, error: 'Database error' };
    }
  }


  public async userExists(
    userId: string
  ): Promise<{
    exists: boolean;
    role?: 'mentor' | 'student' | null | undefined;
    email?: string | undefined;
  }> {
    try {
      const mentor = await this.mentorRepository.findById(userId);
      if (mentor) {
        return {
          exists: true,
          role: 'mentor',
          email: mentor.email
        };
      }
      
      const student = await this.studentRepository.findById(userId);
      if (student) {
        return {
          exists: true,
          role: 'student',
          email: student.email
        };
      }
      
      return {
        exists: false,
        role: null,
        email: undefined
      };
    } catch (error) {
      logger.error('Error checking user existence:', error);
      return {
        exists: false,
        role: null,
        email: undefined
      };
    }
  }

  
  public async getUserFromToken(token: string): Promise<any> {
    try {
     
      const { verifyAccessToken } = require('../utils/jwt.util');
      const decoded = verifyAccessToken(token);
      
      if (!decoded || !decoded.id || !decoded.role) {
        return { success: false, error: 'Invalid token' };
      }
      
      return await this.verifyUserRole(decoded.id, decoded.role);
    } catch (error) {
      logger.error('Error getting user from token:', error);
      return { success: false, error: 'Token verification failed' };
    }
  }

 
  public async getUserEmail(userId: string): Promise<any> {
    try {
      const mentor = await this.mentorRepository.findById(userId);
      if (mentor) {
        return { success: true, email: mentor.email, role: 'mentor' };
      }
      
      const student = await this.studentRepository.findById(userId);
      if (student) {
        return { success: true, email: student.email, role: 'student' };
      }
      
      return { success: false, error: 'User not found' };
    } catch (error) {
      logger.error('Error getting user email:', error);
      return { success: false, error: 'Database error' };
    }
  }
}