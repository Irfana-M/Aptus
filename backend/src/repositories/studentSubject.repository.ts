import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository.js";
import { StudentSubjectModel } from "../models/student/studentSubject.model.js";
import type { IStudentSubject } from "../interfaces/models/studentSubject.interface.js";
import type { IStudentSubjectRepository } from "../interfaces/repositories/IStudentSubjectRepository.js";

@injectable()
export class StudentSubjectRepository extends BaseRepository<IStudentSubject> implements IStudentSubjectRepository {
  constructor() {
    super(StudentSubjectModel);
  }

  async findByStudentAndSubject(studentId: string, subjectId: string): Promise<IStudentSubject | null> {
    return await this.model.findOne({ studentId, subjectId }).lean() as unknown as IStudentSubject | null;
  }
}
