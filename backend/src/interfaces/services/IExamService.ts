import type { CreateExamDTO } from "@/dtos/exam/CreateExamDTO";
import type { UpdateExamDTO } from "@/dtos/exam/UpdateExamDTO";
import type { SubmitExamDTO } from "@/dtos/exam/SubmitExamDTO";
import type { IExam } from "../../models/exam.model";
import type { IExamResult, ExamStatus } from "../../models/examResult.model";

export interface IEnrichedExam extends IExam {
  attemptStatus: ExamStatus | null;
  resultId: string | null;
}

export interface IExamService {
  createExam(data: CreateExamDTO): Promise<IExam>;
  getExamById(examId: string, userId: string, role: string): Promise<IExam>;
  getExamsForStudent(studentId: string): Promise<IEnrichedExam[]>;
  getExamsByMentor(mentorId: string): Promise<IExam[]>;
  updateExam(examId: string, data: UpdateExamDTO): Promise<IExam>;
  deleteExam(examId: string): Promise<void>;
  submitExam(data: SubmitExamDTO): Promise<IExamResult>;
  getStudentResults(studentId: string): Promise<IExamResult[]>;
  getExamResults(examId: string, mentorId: string): Promise<IExamResult[]>;
  gradeStudentExam(resultId: string, mentorId: string, grades: { questionId: string; marks: number; feedback?: string }[]): Promise<IExamResult>;
}
