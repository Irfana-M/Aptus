import type { IAuthRepository } from "../interfaces/IAuthRepository";
import { MentorAuthRepository } from "./mentorAuth.repository";
import { StudentAuthRepository } from "./studentAuth.repository";
import type { AuthUser } from "../interfaces/auth.interface";
import type { RegisterUserDto } from "../dto/RegisteruserDTO";

export class AuthRepository implements IAuthRepository {
  private mentorRepo = new MentorAuthRepository();
  private studentRepo = new StudentAuthRepository();

  async markUserVerified(email: string): Promise<void> {
    let user = await this.mentorRepo.findUserByEmail(email);
    if(user) {
      await this.mentorRepo.markUserVerified(email);
      return;
    }

    user = await this.studentRepo.findUserByEmail(email);
    if (user) {
        await this.studentRepo.markUserVerified(email);
        return;
    }

    throw new Error("User not found");
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    let user = await this.mentorRepo.findUserByEmail(email);
    if (user) return user;

    user = await this.studentRepo.findUserByEmail(email);
    if (user) return user;

    return null;
  }

  async createUser(data: RegisterUserDto): Promise<AuthUser> {
    if (data.role === 'mentor') {
      return this.mentorRepo.createUser(data);
    } else if (data.role === 'student') {
      return this.studentRepo.createUser(data);
    }
    throw new Error('Invalid role');
  }

  async findById(id: string): Promise<AuthUser | null> {
    let user = await this.mentorRepo.findById(id);
    if (user) return user;

    user = await this.studentRepo.findById(id);
    if (user) return user;

    return null;
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    let user = await this.mentorRepo.findUserByEmail(email);
    if (user) {
      await this.mentorRepo.updatePassword(email, hashedPassword);
      return;
    }

    user = await this.studentRepo.findUserByEmail(email);
    if (user) {
      await this.studentRepo.updatePassword(email, hashedPassword);
      return;
    }

    throw new Error("User not found");
  }

  async block(id: string): Promise<boolean> {
    let success = await this.mentorRepo.block(id);
    if (success) return true;

    success = await this.studentRepo.block(id);
    if (success) return true;

    return false;
  }
}

