import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import type { RegisterUserDto } from "../dtos/auth/RegisteruserDTO.js";
import { logger } from "../utils/logger.js"; 
import { HttpStatusCode } from "../constants/httpStatus.js"; 

import { injectable, inject } from "inversify";
import { TYPES } from "../types.js";
import type { IMentorAuthRepository } from "@/interfaces/repositories/IMentorAuthRepository.js";
import type { IStudentAuthRepository } from "@/interfaces/repositories/IStudentAuthRepository.js";
import { MentorModel } from "@/models/mentor/mentor.model.js";

@injectable()
export class AuthRepository implements IAuthRepository<AuthUser> {
  constructor(
    @inject(TYPES.IMentorAuthRepository) private _mentorRepo: IMentorAuthRepository,
    @inject(TYPES.IStudentAuthRepository) private _studentRepo: IStudentAuthRepository
  ) {}


  async findByEmail(email: string): Promise<AuthUser | null> {
    try {
      const user = (await this._mentorRepo.findByEmail(email)) || 
                   (await this._studentRepo.findByEmail(email));
      if (user) {
        logger.info(`User found by email: ${email}, role: ${user.role}`);
      } else {
        logger.warn(`User not found by email: ${email}`);
      }
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding user by email: ${email} - ${message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message };
    }
  }

  async createUser(data: RegisterUserDto): Promise<AuthUser> {
    try {
      let user: AuthUser;
      if (data.role === "mentor") user = await this._mentorRepo.createUser(data);
      else if (data.role === "student") user = await this._studentRepo.createUser(data);
      else throw new Error("Invalid role");

      logger.info(`User created: ${user.email}, role: ${user.role}`);
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error creating user: ${data.email} - ${message}`);
      throw { statusCode: HttpStatusCode.BAD_REQUEST, message };
    }
  }


  async markUserVerified(email: string): Promise<void> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        logger.warn(`Attempted to verify non-existent user: ${email}`);
        throw { statusCode: HttpStatusCode.NOT_FOUND, message: "User not found" };
      }

      if (user.role === "mentor") await this._mentorRepo.markUserVerified(email);
      else await this._studentRepo.markUserVerified(email);

      logger.info(`User verified successfully: ${email}, role: ${user.role}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error verifying user: ${email} - ${message}`);
      throw error;
    }
  }

 async block(id: string): Promise<AuthUser> {
  try {
   
    const mentor = await this._mentorRepo.findById(id);
    if (mentor) {
      await this._mentorRepo.block(id);        
      logger.info(`Mentor blocked: ${id}`);
      return mentor as AuthUser;
    }

    
    const student = await this._studentRepo.findById(id);
    if (student) {
      await this._studentRepo.block(id);
      logger.info(`Student blocked: ${id}`);
      return student as AuthUser;
    }

    throw { statusCode: HttpStatusCode.NOT_FOUND, message: "User not found" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Error blocking user ${id}: ${message}`);
    throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message };
  }
}

  async unblock(id: string): Promise<AuthUser> {
    const mentor = await this._mentorRepo.findById(id);
    if (mentor) {
      await this._mentorRepo.unblock(id);
      return mentor as AuthUser;
    }

    const student = await this._studentRepo.findById(id);
    if (student) {
      await this._studentRepo.unblock(id);
      return student as AuthUser;
    }

    throw { statusCode: HttpStatusCode.NOT_FOUND, message: "User not found" };
  }
  
  async findById(id: string): Promise<AuthUser | null> {
    try {
      const user = (await this._mentorRepo.findById(id)) || (await this._studentRepo.findById(id));
      if (user) logger.info(`User found by ID: ${id}, role: ${user.role}`);
      else logger.warn(`User not found by ID: ${id}`);
      return user;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Error finding user by ID: ${id} - ${message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message };
    }
  }

  async checkforAvailabilty({email, fullName}:{email: string, fullName:string}): Promise<boolean> {
    const result =await MentorModel.find({email : email, fullName:fullName});
    if(result) {
      return true;
    }
    else{
      return false;
    }
  }
}
