import type { IStudentSubject } from "../../interfaces/models/studentSubject.interface.js";

export interface IStudentSubjectRepository {
  findByStudentAndSubject(studentId: string, subjectId: string): Promise<IStudentSubject | null>;
}
