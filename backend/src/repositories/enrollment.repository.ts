import { injectable } from "inversify";
import { Enrollment,type IEnrollment } from "../models/enrollment.model";
import type { IEnrollmentRepository } from "../interfaces/repositories/IEnrollmentRepository";
import { BaseRepository } from "./baseRepository";

@injectable()
export class EnrollmentRepository extends BaseRepository<IEnrollment> implements IEnrollmentRepository {
  constructor() {
    super(Enrollment);
  }

  async findByStudentAndCourse(studentId: string, courseId: string): Promise<IEnrollment | null> {
    return await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });
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
      .sort({ enrollmentDate: -1 });
  }

  async findByIdAndUpdate(id: string, update: Partial<IEnrollment>): Promise<IEnrollment | null> {
    return await Enrollment.findByIdAndUpdate(id, update, { new: true });
  }

  // create is inherited from BaseRepository but BaseRepository might take T or something else.
  // BaseRepository usually has create(data: Partial<T>): Promise<T>
  // Let's verify BaseRepository signature usually, but assuming it works or I override it.
  // Actually BaseRepository often takes Dto. 
  // Let's explicitly implement create to be safe given the interface loop.
  async create(data: Partial<IEnrollment>): Promise<IEnrollment> {
      return await Enrollment.create(data);
  }
}
