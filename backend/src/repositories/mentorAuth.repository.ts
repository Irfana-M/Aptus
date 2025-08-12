import { MentorModel } from "../models/mentor.model";
import type { AuthUser } from "../entities/auth.interface";
import type { IAuthRepository } from "../interfaces/IAuthRepository";
import type { RegisterUserDto } from "../dto/RegisteruserDTO";
import type { MentorProfile } from "../interfaces/mentor.interface";

export class MentorAuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const mentor = await MentorModel.findOne({ email });
    if (!mentor) return null;

    return {
      _id: mentor._id.toString(),
      fullName: mentor.fullName,
      email: mentor.email,
      role: "mentor",
      password: mentor.password,
      phone: mentor.phone,
    };
  }

  async markUserVerified(email: string): Promise<void> {
    await MentorModel.updateOne({ email }, { $set: { isVerified: true } });
  }

  async findById(id: string): Promise<AuthUser | null> {
    const mentor = await MentorModel.findById(id);
    if (!mentor) return null;

    return {
      _id: mentor._id.toString(),
      fullName: mentor.fullName,
      email: mentor.email,
      role: "mentor",
      password: mentor.password,
      phone: mentor.phone,
    };
  }

  async createUser(data: RegisterUserDto): Promise<AuthUser> {
    const { role, ...dataWithoutRole } = data; // role should be 'mentor'
    const createdMentor = await MentorModel.create(dataWithoutRole);
    return { ...createdMentor.toObject(), role: "mentor" };
  }

  async updateProfile(id: string, data: Partial<MentorProfile>): Promise<MentorProfile | null> {
    const updatedMentor = await MentorModel.findByIdAndUpdate(id, data, { new: true });
    return updatedMentor ? updatedMentor.toObject() : null;
  }

  async updateVerificationStatus(id: string, isVerified: boolean, reason?: string): Promise<MentorProfile | null> {
    const updatedMentor = await MentorModel.findByIdAndUpdate(
      id,
      { isVerified, verificationReason: reason },
      { new: true }
    );
    return updatedMentor ? updatedMentor.toObject() : null;
  }

  async block(id: string): Promise<boolean> {
    const result = await MentorModel.findByIdAndUpdate(id, { blocked: true });
    return result !== null;
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    await MentorModel.updateOne({ email }, { password: hashedPassword });
  }

  async listAllMentor(): Promise<MentorProfile[]> {
    return MentorModel.find({}).lean();
  }
}
