import type { IBaseRepository } from "./IBaseRepository.js";
import type { IExam } from "../../models/exam.model.js";
import type { IExamResult } from "../../models/examResult.model.js";

export interface IExamRepository extends IBaseRepository<IExam> {
  findBySubjectAndGrade(subjectId: string, gradeId: string): Promise<IExam[]>;
  findBySubjectsAndGrades(subjectIds: string[], gradeIds: string[]): Promise<IExam[]>;
  findByMentorId(mentorId: string): Promise<IExam[]>;
  createResult(resultData: Partial<IExamResult>): Promise<IExamResult>;
  findResult(studentId: string, examId: string): Promise<IExamResult | null>;
  findResultsByStudent(studentId: string): Promise<IExamResult[]>;
  findResultsByExam(examId: string): Promise<IExamResult[]>;
  findResultById(resultId: string): Promise<IExamResult | null>;
  updateResult(resultId: string, updates: Partial<IExamResult>): Promise<IExamResult | null>;
}
