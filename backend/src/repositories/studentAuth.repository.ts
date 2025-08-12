import { StudentModel } from "../models/student.model";
import type { AuthUser } from "../entities/auth.interface";
import type { IAuthRepository } from "../interfaces/IAuthRepository.ts";
import type { RegisterUserDto } from "../dto/RegisteruserDTO";

export class StudentAuthRepository implements IAuthRepository {
  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const student = await StudentModel.findOne({ email });
    if (!student) return null;

    return {
      _id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      role: "student",
      password: student.password,
      phone: student.phone,
    };
  }

  async markUserVerified(email: string): Promise<void> {
    await StudentModel.updateOne({ email }, { $set: { isVerified: true } });
  }


  async findById(id: string): Promise<AuthUser | null> {
    const student = await StudentModel.findById(id);
    if (!student) return null;

    return {
      _id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      role: "student",
      password: student.password,
      phone: student.phone,
    };
  }

  async createUser(data: RegisterUserDto): Promise<AuthUser> {
    const { role, ...dataWithoutRole } = data; // role should be 'student'
    const createdStudent = await StudentModel.create(dataWithoutRole);
    return { ...createdStudent.toObject(), role: "student" };
  }

  async updateProfile(id: string, data: Partial<AuthUser>): Promise<AuthUser | null> {
    const updatedStudent = await StudentModel.findByIdAndUpdate(id, data, { new: true });
    if (!updatedStudent) return null;
    return {
      _id: updatedStudent._id.toString(),
      fullName: updatedStudent.fullName,
      email: updatedStudent.email,
      role: "student",
      password: updatedStudent.password,
      phone: updatedStudent.phone,
    };
  }

  async block(id: string): Promise<boolean> {
    const result = await StudentModel.findByIdAndUpdate(id, { blocked: true });
    return result !== null;
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    await StudentModel.updateOne({ email }, { password: hashedPassword });
  }
}
