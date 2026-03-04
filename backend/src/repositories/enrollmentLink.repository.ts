import { injectable } from "inversify";
import { Enrollment, type IEnrollment } from "../models/enrollment.model.js";
import type { IEnrollmentLinkRepository } from "../interfaces/repositories/IEnrollmentLinkRepository.js";
import { BaseRepository } from "./baseRepository.js";
import type { FilterQuery } from "mongoose";

@injectable()
export class EnrollmentLinkRepository extends BaseRepository<IEnrollment> implements IEnrollmentLinkRepository {
  constructor() {
    super(Enrollment);
  }

  async findByStudentAndCourse(studentId: string, courseId: string): Promise<IEnrollment | null> {
    return await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });
  }

  async findByCourse(courseId: string): Promise<IEnrollment[]> {
    return await Enrollment.find({ course: courseId, status: "active" }).populate("student").lean() as unknown as IEnrollment[];
  }

  async findByStudent(studentId: string): Promise<IEnrollment[]> {
    return await Enrollment.find({ student: studentId })
      .populate({
        path: "course",
        populate: [
          { path: "grade", select: "name syllabus" },
          { path: "subject", select: "subjectName" },
          { path: "mentor", select: "fullName email profilePicture" },
        ],
      })
      .sort({ enrollmentDate: -1 })
      .lean() as unknown as IEnrollment[];
  }

  async findByIdAndUpdate(id: string, update: Partial<IEnrollment>): Promise<IEnrollment | null> {
    return await Enrollment.findByIdAndUpdate(id, update, { new: true });
  }

  async create(data: Partial<IEnrollment>): Promise<IEnrollment> {
      return await Enrollment.create(data);
  }

  async countActiveByStudent(studentId: string): Promise<number> {
    return await Enrollment.countDocuments({
      student: studentId,
      status: 'active'
    });
  }

  async deleteByFilter(filter: FilterQuery<IEnrollment>): Promise<boolean> {
    const result = await Enrollment.deleteMany(filter);
    return result.deletedCount > 0;
  }

  async findAll(): Promise<IEnrollment[]> {
    return await Enrollment.find()
      .populate("student", "fullName email profileImage")
      .populate({
        path: "course",
        populate: [
          { path: "grade", select: "name syllabus" },
          { path: "subject", select: "subjectName" },
          { path: "mentor", select: "fullName email profilePicture profileImageUrl" },
        ],
      })
      .sort({ enrollmentDate: -1 })
      .lean() as unknown as IEnrollment[];
  }
}
