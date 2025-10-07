import { StudentModel } from "../models/student.model.js";
import type { StudentProfile } from "../interfaces/models/student.interface.js";
import type { IVerificationRepository } from "../interfaces/repositories/IVerificationRepository.js";
import type { IAuthRepository } from "../interfaces/auth/IAuthRepository.js";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository.js";
import type { RegisterUserDto } from "../dto/RegisteruserDTO.js";
import type { AuthUser } from "../interfaces/auth/auth.interface.js";
import bcrypt from "bcryptjs";

export class StudentAuthRepository
  implements IAuthRepository, IStudentRepository, IVerificationRepository
{
  async findByEmail(email: string): Promise<AuthUser | null> {
    const student = await StudentModel.findOne({ email }).lean();
    if (!student) return null;

    return {
      _id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      password: student.password,
      phoneNumber: student.phoneNumber,
      role: "student",
      isVerified: student.isVerified ?? false,
    };
  }

  async comparePassword(user: AuthUser, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async findById(id: string): Promise<AuthUser | null> {
    const student = await StudentModel.findById(id).lean();
    if (!student) return null;

    return {
      _id: student._id.toString(),
      fullName: student.fullName,
      email: student.email,
      password: student.password,
      phoneNumber: student.phoneNumber,
      role: "student",
      isVerified: student.isVerified ?? false,
    };
  }

  async createUser(data: AuthUser | RegisterUserDto): Promise<AuthUser> {
    const { role, ...dataWithoutRole } = data as any;
    const createdStudent = await StudentModel.create(dataWithoutRole);

    return {
      _id: createdStudent._id.toString(),
      fullName: createdStudent.fullName,
      email: createdStudent.email,
      password: createdStudent.password,
      phoneNumber: createdStudent.phoneNumber,
      role: "student",
      isVerified: createdStudent.isVerified ?? false,
    };
  }

  async updatePassword(email: string, hashedPassword: string): Promise<void> {
    await StudentModel.updateOne({ email }, { password: hashedPassword });
  }

  async markUserVerified(email: string): Promise<void> {
    const result = await StudentModel.updateOne({ email }, { $set: { isVerified: true } });
    if (result.matchedCount === 0) throw new Error(`Student not found: ${email}`);
  }

  async block(id: string): Promise<boolean> {
    return this.blockStudent(id); // delegate to student-specific method
  }

  async updateProfile(id: string, data: Partial<StudentProfile>): Promise<StudentProfile | null> {
    const updated = await StudentModel.findByIdAndUpdate(id, data, { new: true }).lean();
    return updated || null;
  }

  async blockStudent(id: string): Promise<boolean> {
    const result = await StudentModel.findByIdAndUpdate(id, { $set: { blocked: true } });
    return result !== null;
  }

  async listAllStudents(): Promise<StudentProfile[]> {
    return StudentModel.find({}).lean();
  }
}
