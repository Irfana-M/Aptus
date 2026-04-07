import { injectable } from "inversify";
import { BaseRepository } from "./baseRepository";
import type { IExam } from "../models/exam.model";
import { Exam } from "../models/exam.model";
import type { IExamResult } from "../models/examResult.model";
import { ExamResult } from "../models/examResult.model";
import type { IExamRepository } from "../interfaces/repositories/IExamRepository";

@injectable()
export class ExamRepository extends BaseRepository<IExam> implements IExamRepository {
  constructor() {
    super(Exam);
  }

  async findBySubjectAndGrade(subjectId: string, gradeId: string): Promise<IExam[]> {
    return this.model.find({ subjectId, gradeId, isActive: true }).exec();
  }

  async findBySubjectsAndGrades(subjectIds: string[], gradeIds: string[]): Promise<IExam[]> {
    return this.model.find({ 
      subjectId: { $in: subjectIds }, 
      gradeId: { $in: gradeIds },
      isActive: true 
    }).populate('subjectId gradeId mentorId').exec();
  }

  async findByMentorId(mentorId: string): Promise<IExam[]> {
    return this.model.find({ mentorId }).populate('subjectId gradeId').exec();
  }

  async createResult(resultData: Partial<IExamResult>): Promise<IExamResult> {
    const result = new ExamResult(resultData);
    return result.save();
  }

  async findResult(studentId: string, examId: string): Promise<IExamResult | null> {
    return ExamResult.findOne({ studentId, examId }).exec();
  }

  async findResultsByStudent(studentId: string): Promise<IExamResult[]> {
    return ExamResult.find({ studentId }).populate('examId').exec();
  }

  async findResultsByExam(examId: string): Promise<IExamResult[]> {
    return ExamResult.find({ examId }).populate('studentId').exec();
  }

  async findResultById(resultId: string): Promise<IExamResult | null> {
    return ExamResult.findById(resultId).populate('examId studentId').exec();
  }

  async updateResult(resultId: string, updates: Partial<IExamResult>): Promise<IExamResult | null> {
    return ExamResult.findByIdAndUpdate(resultId, updates, { new: true }).exec();
  }
}
