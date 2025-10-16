import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";

export class AuthRepository implements IAuthRepository {
  constructor(
    private _mentorRepo: IAuthRepository,
    private _studentRepo: IAuthRepository
  ) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    return (await this._mentorRepo.findByEmail(email)) || (await this._studentRepo.findByEmail(email));
  }

  async createUser(data: RegisterUserDto): Promise<AuthUser> {
    if (data.role === 'mentor') return this._mentorRepo.createUser(data);
    if (data.role === 'student') return this._studentRepo.createUser(data);
    throw new Error('Invalid role');
  }

  async markUserVerified(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) throw new Error('User not found');

    user.role === 'mentor'
      ? await this._mentorRepo.markUserVerified(email)
      : await this._studentRepo.markUserVerified(email);
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) throw new Error('User not found');

    user.role === 'mentor'
      ? await this._mentorRepo.updatePassword(email, hashedPassword)
      : await this._studentRepo.updatePassword(email, hashedPassword);
  }

  async block(id: string): Promise<boolean> {
    return (await this._mentorRepo.block(id)) || (await this._studentRepo.block(id));
  }

  async findById(id: string): Promise<AuthUser | null> {
    return (await this._mentorRepo.findById(id)) || (await this._studentRepo.findById(id));
  }
}
