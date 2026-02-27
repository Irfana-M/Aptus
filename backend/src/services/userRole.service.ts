import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { IUserRoleService, VerificationResponse, UserExistenceResponse, UserEmailResponse, TrialClassAuthData } from "@/interfaces/services/IUserRoleSrvice";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type {  StudentBaseResponseDto } from "@/dtos/auth/UserResponseDTO";
import type { MentorResponseDto } from "@/dtos/mentor/MentorResponseDTO";
import { logger } from "../utils/logger";
import { MentorMapper } from "@/mappers/MentorMapper";
import { StudentMapper } from "@/mappers/StudentMapper";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository";
import { verifyAccessToken } from "../utils/jwt.util";
import { Types } from "mongoose";
import type { ISessionRepository } from "@/interfaces/repositories/ISessionRepository";

@injectable()
export class UserRoleService implements IUserRoleService {
  constructor(
    @inject(TYPES.IMentorRepository) private mentorRepository: IMentorRepository,
    @inject(TYPES.IStudentRepository) private studentRepository: IStudentRepository,
    @inject(TYPES.ITrialClassRepository) private trialClassRepository: ITrialClassRepository,
    @inject(TYPES.ISessionRepository) private sessionRepository: ISessionRepository
  ) {}

  

  async verifyUserRole(
    userId: string,
    role: "mentor" | "student" | "admin"
  ): Promise<VerificationResponse> {
    try {
      if (role === "mentor") {
        const mentor = await this.mentorRepository.findById(userId);
        if (!mentor) return { success: false, error: "Mentor not found" };
        return { success: true, user: MentorMapper.toResponseDto(mentor) };
      }

      if (role === "student") {
        const student = await this.studentRepository.findById(userId);
        if (!student) return { success: false, error: "Student not found" };
        const dto = StudentMapper.toStudentResponseDto(student);
        return { success: true, user: { ...dto, role: "student" } };
      }

      if (role === "admin") {
         return { success: true }; // Basic check for admin for now
      }

      return { success: false, error: "Invalid role" };
    } catch (error: unknown) {
      logger.error('Error verifying user role:', error);
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
    trialClass?: TrialClassAuthData;
    error?: string;
    isSession?: boolean;
  }> {
    try {
      // 1. Try Trial Class First
      let trialClass;
      try {
        trialClass = await this.trialClassRepository.findById(trialClassId);
      } catch (_err) {
        // Not a trial class, continue to check regular session
        logger.debug(`ID ${trialClassId} not found in trial classes, checking sessions...`);
      }
      
      if (trialClass) {
          let isAuthorized = false;
          
          const studentId = (trialClass.student as unknown as { _id?: Types.ObjectId } | null)?._id 
            ? (trialClass.student as unknown as { _id: Types.ObjectId })._id.toString() 
            : trialClass.student?.toString();
            
          const mentorId = (trialClass.mentor as unknown as { _id?: Types.ObjectId } | null)?._id 
            ? (trialClass.mentor as unknown as { _id: Types.ObjectId })._id.toString() 
            : trialClass.mentor?.toString();
          
          if (role === 'student') {
            isAuthorized = studentId === userId;
          } else if (role === 'mentor') {
            isAuthorized = mentorId === userId;
          }
          
          if (isAuthorized) {
            return {
              authorized: true,
              trialClass: {
                id: (trialClass as any)._id?.toString(),
                status: (trialClass as any).status,
                studentId: studentId,
                mentorId: mentorId,
                preferredDate: (trialClass as any).preferredDate,
                meetLink: (trialClass as any).meetLink
              }
            };
          }
          
          return { 
             authorized: false, 
             error: `User not authorized for trial class.`,
             trialClass
          };
      }

      // 2. Fallback to Session (Regular Class)
      let session;
      try {
        session = await this.sessionRepository.findById(trialClassId);
      } catch (_err) {
        logger.debug(`ID ${trialClassId} not found in sessions.`);
      }
      
      if (session) {
          let isAuthorized = false;
          
          // Check participants array first (handles Group & 1:1)
          const participant = session.participants?.find((p) => 
              p.userId && p.userId.toString() === userId && p.role === role
          );

          if (participant) {
              isAuthorized = true;
          } else {
              // Legacy/Fallback check for direct fields (if schema allows, though schema says participants)
              const studentId = (session as unknown as { studentId?: { toString(): string } }).studentId?.toString();
              const mentorId = (session as unknown as { mentorId?: { toString(): string } }).mentorId?.toString();
              
              if (role === 'student' && studentId === userId) isAuthorized = true;
              if (role === 'mentor' && mentorId === userId) isAuthorized = true;
          }

          if (isAuthorized) {
            return {
              authorized: true,
              trialClass: {
                id: (session as any)._id?.toString(),
                status: (session as any).status,
                meetLink: (session as any).webRTCId
              },
              isSession: true
            };
          }
          
           return { 
             authorized: false, 
             error: `User not authorized for session.`,
             trialClass: {
                id: (session as any)._id?.toString(),
                status: (session as any).status,
                meetLink: (session as any).webRTCId
             }
          };
      }
      
      return { 
        authorized: false, 
        error: 'Class/Session not found' 
      };

    } catch (error) {
      logger.error('Error verifying trial class authorization:', error);
      return { authorized: false, error: 'Database error' };
    }
  }


  public async userExists(
    userId: string
  ): Promise<UserExistenceResponse> {
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

  
  public async getUserFromToken(token: string): Promise<VerificationResponse> {
    try {
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

 
  public async getUserEmail(userId: string): Promise<UserEmailResponse> {
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