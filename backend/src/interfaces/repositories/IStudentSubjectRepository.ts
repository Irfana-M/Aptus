import type { IStudentSubject } from "../../interfaces/models/studentSubject.interface";

export interface IStudentSubjectRepository {
  findByStudentAndSubject(studentId: string, subjectId: string): Promise<IStudentSubject | null>;
}
