import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import { MentorAuthRepository } from "./mentorAuth.repository.js";
import { StudentAuthRepository } from "./studentAuth.repository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";

export class AuthRepository implements IAuthRepository {
  private _mentorRepo = new MentorAuthRepository();
  private _studentRepo = new StudentAuthRepository();

  async markUserVerified(email: string): Promise<void> {
    let user = await this._mentorRepo.findByEmail(email);
    if(user) {
      await this._mentorRepo.markUserVerified(email);
      return;
    }

    user = await this._studentRepo.findByEmail(email);
    if (user) {
        await this._studentRepo.markUserVerified(email);
        return;
    }

    throw new Error("User not found");
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    let user = await this._mentorRepo.findByEmail(email);
    if (user) return user;

    user = await this._studentRepo.findByEmail(email);
    if (user) return user;

    return null;
  }

  async createUser(data: RegisterUserDto): Promise<AuthUser> {
    if (data.role === 'mentor') {
      return this._mentorRepo.createUser(data);
    } else if (data.role === 'student') {
      return this._studentRepo.createUser(data);
    }
    throw new Error('Invalid role');
  }

  async findById(id: string): Promise<AuthUser | null> {
    let user = await this._mentorRepo.findById(id);
    if (user) return user;

    user = await this._studentRepo.findById(id);
    if (user) return user;

    return null;
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    let user = await this._mentorRepo.findByEmail(email);
    if (user) {
      await this._mentorRepo.updatePassword(email, hashedPassword);
      return;
    }

    user = await this._studentRepo.findByEmail(email);
    if (user) {
      await this._studentRepo.updatePassword(email, hashedPassword);
      return;
    }

    throw new Error("User not found");
  }

  async block(id: string): Promise<boolean> {
    let success = await this._mentorRepo.block(id);
    if (success) return true;

    success = await this._studentRepo.blockStudent(id);
    if (success) return true;

    return false;
  }
}

