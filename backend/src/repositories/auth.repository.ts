import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import { logger } from "../utils/logger.js"; 
import { HttpStatusCode } from "../constants/httpStatus.js"; 

export class AuthRepository implements IAuthRepository {
  constructor(
    private _mentorRepo: IAuthRepository,
    private _studentRepo: IAuthRepository
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
    } catch (error: any) {
      logger.error(`Error finding user by email: ${email} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
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
    } catch (error: any) {
      logger.error(`Error creating user: ${data.email} - ${error.message}`);
      throw { statusCode: HttpStatusCode.BAD_REQUEST, message: error.message };
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
    } catch (error: any) {
      logger.error(`Error verifying user: ${email} - ${error.message}`);
      throw error;
    }
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    try {
      let user = await this._mentorRepo.findByEmail(email);
      if (user) {
        await this._mentorRepo.updatePassword(email, hashedPassword);
        logger.info(`Password updated for mentor: ${email}`);
        return;
      }

      user = await this._studentRepo.findByEmail(email);
      if (user) {
        await this._studentRepo.updatePassword(email, hashedPassword);
        logger.info(`Password updated for student: ${email}`);
        return;
      }

      logger.warn(`Password update failed: User not found (${email})`);
      throw { statusCode: HttpStatusCode.NOT_FOUND, message: "User not found" };
    } catch (error: any) {
      logger.error(`Error updating password: ${email} - ${error.message}`);
      throw error;
    }
  }


  async block(id: string): Promise<boolean> {
    try {
      const result = (await this._mentorRepo.block(id)) || (await this._studentRepo.block(id));
      logger.info(`User block attempt for ID: ${id} - Result: ${result}`);
      return result;
    } catch (error: any) {
      logger.error(`Error blocking user: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }

  
  async findById(id: string): Promise<AuthUser | null> {
    try {
      const user = (await this._mentorRepo.findById(id)) || (await this._studentRepo.findById(id));
      if (user) logger.info(`User found by ID: ${id}, role: ${user.role}`);
      else logger.warn(`User not found by ID: ${id}`);
      return user;
    } catch (error: any) {
      logger.error(`Error finding user by ID: ${id} - ${error.message}`);
      throw { statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR, message: error.message };
    }
  }
}
