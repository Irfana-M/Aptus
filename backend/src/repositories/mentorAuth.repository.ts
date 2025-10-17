import { MentorModel } from "../models/mentor.model.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import type { MentorProfile } from "../interfaces/models/mentor.interface.js";
import type { IMentorRepository } from "../interfaces/repositories/IMentorRepository.js";
import bcrypt from "bcryptjs";

export class MentorAuthRepository implements IAuthRepository,IMentorRepository,IVerificationRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const mentor = await MentorModel.findOne({ email }).lean();
    if (!mentor) return null;

    return {
      _id: mentor._id.toString(),
      fullName: mentor.fullName,
      email: mentor.email,
      password: mentor.password,
      phoneNumber: mentor.phoneNumber, 
      role: "mentor",
      isVerified: mentor.isVerified ?? false,
    };
  }

  async markUserVerified(email: string): Promise<void> {
    const result = await MentorModel.updateOne({ email }, { $set: { isVerified: true } });
    if (result.matchedCount === 0) {
      throw new Error(`Mentor with email ${email} not found`);
    }
    console.log(`MentorAuthRepository: Updated isVerified for ${email}:`, result);
  }

  async findById(id: string): Promise<AuthUser | null> {
    const mentor = await MentorModel.findById(id).lean();
    if (!mentor) return null;

    return {
      _id: mentor._id.toString(),
      fullName: mentor.fullName,
      email: mentor.email,
      password: mentor.password,
      phoneNumber: mentor.phoneNumber,
      role: "mentor",
      isVerified: mentor.isVerified ?? false,
    };
  }

  async comparePasswords(user: AuthUser, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null> {
    const updatedMentor = await MentorModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return updatedMentor || null;
}

async updateVerificationStatus(id: string, isVerified: boolean, reason?: string): Promise<MentorProfile | null> {
    const update: Partial<MentorProfile> = { isVerified };
    if (reason) (update as any).verificationReason = reason; // if you track reason
    const updatedMentor = await MentorModel.findByIdAndUpdate(id, update, { new: true }).lean();
    return updatedMentor || null;
}

  async createUser(data: AuthUser | RegisterUserDto): Promise<AuthUser> {
    const { role, ...dataWithoutRole } = data;
    const createdMentor = await MentorModel.create(dataWithoutRole);

    return {
      _id: createdMentor._id.toString(),
      fullName: createdMentor.fullName,
      email: createdMentor.email,
      password: createdMentor.password,
      phoneNumber: createdMentor.phoneNumber,
      role: "mentor",
      isVerified: createdMentor.isVerified ?? false,
    };
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    await MentorModel.updateOne({ email }, { password: hashedPassword });
  }

  async block(id: string): Promise<boolean> {
    const result = await MentorModel.findByIdAndUpdate(id, { isBlocked: true });
    return result !== null;
  }

  async blockMentor(id: string): Promise<boolean> {
    return this.block(id);
}

  
  async listAllMentor(): Promise<MentorProfile[]> {
    return MentorModel.find({}).lean();
  }
}
