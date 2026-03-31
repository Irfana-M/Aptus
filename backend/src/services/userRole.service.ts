import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { IUserRoleService, VerificationResponse, UserExistenceResponse, UserEmailResponse, TrialClassAuthData } from "@/interfaces/services/IUserRoleSrvice.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type {  StudentBaseResponseDto } from "@/dtos/auth/UserResponseDTO.js";
import type { MentorResponseDto } from "@/dtos/mentor/MentorResponseDTO.js";
import { logger } from "../utils/logger.js";
import { MentorMapper } from "@/mappers/MentorMapper.js";
import { StudentMapper } from "@/mappers/StudentMapper.js";
import type { ITrialClassRepository } from "@/interfaces/repositories/ITrialClassRepository.js";
import { verifyAccessToken } from "../utils/jwt.util.js";
import { Types } from "mongoose";
import { MESSAGES } from "@/constants/messages.constants.js";
import type { ISessionRepository } from "@/interfaces/repositories/ISessionRepository.js";

@injectable()
export class UserRoleService implements IUserRoleService {
  constructor(
    @inject(TYPES.IMentorRepository) private _mentorRepository: IMentorRepository,
    @inject(TYPES.IStudentRepository) private _studentRepository: IStudentRepository,
    @inject(TYPES.ITrialClassRepository) private _trialClassRepository: ITrialClassRepository,
    @inject(TYPES.ISessionRepository) private _sessionRepository: ISessionRepository
  ) {}

  

  async verifyUserRole(
    userId: string,
    role: "mentor" | "student" | "admin"
  ): Promise<VerificationResponse> {
    try {
      if (role === "mentor") {
        const mentor = await this._mentorRepository.findById(userId);
        if (!mentor) return { success: false, error: MESSAGES.AUTH.USER_NOT_FOUND };
        return { success: true, user: MentorMapper.toResponseDto(mentor) };
      }

      if (role === "student") {
        const student = await this._studentRepository.findById(userId);
        if (!student) return { success: false, error: MESSAGES.AUTH.USER_NOT_FOUND };
        const dto = StudentMapper.toStudentResponseDto(student);
        return { success: true, user: { ...dto, role: "student" } };
      }

      if (role === "admin") {
         return { success: true };
      }

      return { success: false, error: MESSAGES.AUTH.INVALID_ROLE };
    } catch (error: unknown) {
      logger.error('Error verifying user role:', error);
      return { success: false, error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR };
    }
  }

  public async getUserByIdAndRole(
    userId: string, 
    role: 'mentor' | 'student'
  ): Promise<MentorResponseDto | StudentBaseResponseDto | null> {
    try {
      if (role === 'mentor') {
        const mentor = await this._mentorRepository.findById(userId);
        if (!mentor) return null;
        
        return MentorMapper.toResponseDto(mentor);
      } 
      
      if (role === 'student') {
        const student = await this._studentRepository.findById(userId);
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
        trialClass = await this._trialClassRepository.findById(trialClassId);
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
             error: MESSAGES.TRIAL_CLASS.ACCESS_DENIED,
             trialClass
          };
      }

      // 2. Fallback to Session (Regular Class)
      let session;
      try {
        session = await this._sessionRepository.findById(trialClassId);
      } catch (_err) {
        logger.debug(`ID ${trialClassId} not found in sessions.`);
      }
      
      if (session) {
          let isAuthorized = false;
          
          // Check participants array first (handles Group & 1:1)
          const participant = session.participants?.find((p: any) => {
              if (!p.userId) return false;
              // Handle both populated and unpopulated userId
              const pId = p.userId._id ? p.userId._id.toString() : p.userId.toString();
              return pId === userId && p.role === role;
          });

          if (participant) {
              isAuthorized = true;
          } else {
              // Legacy/Fallback check for direct fields (if schema allows, though schema says participants)
              const sIdField = (session as any).studentId;
              const mIdField = (session as any).mentorId;
              
              const studentId = sIdField?._id ? sIdField._id.toString() : sIdField?.toString();
              const mentorId = mIdField?._id ? mIdField._id.toString() : mIdField?.toString();
              
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
             error: MESSAGES.TRIAL_CLASS.ACCESS_DENIED,
             trialClass: {
                id: (session as any)._id?.toString(),
                status: (session as any).status,
                meetLink: (session as any).webRTCId
             }
          };
      }
      
      return { 
        authorized: false, 
        error: MESSAGES.COMMON.NOT_FOUND 
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
      const mentor = await this._mentorRepository.findById(userId);
      if (mentor) {
        return {
          exists: true,
          role: 'mentor',
          email: mentor.email
        };
      }
      
      const student = await this._studentRepository.findById(userId);
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
        return { success: false, error: MESSAGES.AUTH.INVALID_TOKEN };
      }
      
      return await this.verifyUserRole(decoded.id, decoded.role);
    } catch (error) {
      logger.error('Error getting user from token:', error);
      return { success: false, error: MESSAGES.AUTH.INVALID_TOKEN };
    }
  }

 
  public async getUserEmail(userId: string): Promise<UserEmailResponse> {
    try {
      const mentor = await this._mentorRepository.findById(userId);
      if (mentor) {
        return { success: true, email: mentor.email, role: 'mentor' };
      }
      
      const student = await this._studentRepository.findById(userId);
      if (student) {
        return { success: true, email: student.email, role: 'student' };
      }
      
      return { success: false, error: MESSAGES.AUTH.USER_NOT_FOUND };
    } catch (error) {
      logger.error('Error getting user email:', error);
      return { success: false, error: MESSAGES.COMMON.INTERNAL_SERVER_ERROR };
    }
  }
}