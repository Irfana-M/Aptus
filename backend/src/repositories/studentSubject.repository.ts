import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import { StudentSubjectModel } from "../models/student/studentSubject.model";
import type { IStudentSubject } from "../interfaces/models/studentSubject.interface";
import type { IStudentSubjectRepository } from "../interfaces/repositories/IStudentSubjectRepository";

@injectable()
export class StudentSubjectRepository extends BaseRepository<IStudentSubject> implements IStudentSubjectRepository {
  constructor() {
    super(StudentSubjectModel);
  }

  async findByStudentAndSubject(studentId: string, subjectId: string): Promise<IStudentSubject | null> {
    return await this.model.findOne({ studentId, subjectId }).lean() as unknown as IStudentSubject | null;
  }
}
