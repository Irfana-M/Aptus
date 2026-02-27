import { injectable, inject } from "inversify";
import mongoose from "mongoose";
import { TYPES } from "../types";
import type { IExamService, IEnrichedExam } from "../interfaces/services/IExamService";
import type { IExamRepository } from "../interfaces/repositories/IExamRepository";
import type { ICourseRepository } from "../interfaces/repositories/ICourseRepository";
import type { IStudentRepository } from "../interfaces/repositories/IStudentRepository";
import type { CreateExamDTO } from "../dtos/exam/CreateExamDTO";
import type { UpdateExamDTO } from "../dtos/exam/UpdateExamDTO";
import type { SubmitExamDTO } from "../dtos/exam/SubmitExamDTO";
import type { IExam } from "../models/exam.model";
import type { IExamResult, IAnswer as _IAnswer } from "../models/examResult.model";
import { ExamStatus } from "../models/examResult.model";
import { AppError } from "../utils/AppError";
import { HttpStatusCode } from "../constants/httpStatus";
import { QuestionType as _QuestionType } from "../models/exam.model";
import type { IQuestion } from "../models/exam.model";

import { ExamAccessPolicyService } from "./exam/ExamAccessPolicyService";
import { ExamScoringService } from "./exam/ExamScoringService";
import { ExamResultEnricher } from "./exam/ExamResultEnricher";

@injectable()
export class ExamService implements IExamService {
  constructor(
    @inject(TYPES.IExamRepository) private _examRepository: IExamRepository,
    @inject(TYPES.ICourseRepository) private _courseRepository: ICourseRepository,
    @inject(TYPES.IStudentRepository) private _studentRepo: IStudentRepository,
    @inject(TYPES.ExamAccessPolicyService) private _accessPolicyService: ExamAccessPolicyService,
    @inject(TYPES.ExamScoringService) private _scoringService: ExamScoringService,
    @inject(TYPES.ExamResultEnricher) private _resultEnricher: ExamResultEnricher
  ) {}

  async createExam(data: CreateExamDTO): Promise<IExam> {
    const totalMarks = this._scoringService.calculateTotalMarks(data.questions as unknown as IQuestion[]);
    
    // Ensure passing marks doesn't exceed total marks
    if (data.passingMarks > totalMarks) {
        throw new AppError("Passing marks cannot be greater than total marks", HttpStatusCode.BAD_REQUEST);
    }

    const examData = {
        ...data,
        totalMarks
    };

    return this._examRepository.create(examData as unknown as Partial<IExam>);
  }

  async getExamById(examId: string, userId: string, role: string): Promise<IExam> {
    const exam = await this._examRepository.findById(examId);
    if (!exam) {
      throw new AppError("Exam not found", HttpStatusCode.NOT_FOUND);
    }
    
    // For students, we apply plan-based filtering
    if (role === 'student') {
        const student = await this._studentRepo.findById(userId);
        if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
        
        const shouldFilter = this._accessPolicyService.shouldFilterQuestions(student);
        return this._accessPolicyService.filterQuestions(exam, shouldFilter);
    }

    return exam;
  }

  async getExamsForStudent(studentId: string): Promise<IEnrichedExam[]> {
    console.log(`[ExamService] Fetching exams for student: ${studentId}`);
    // Get student's enrolled courses to determine their subject/grade combinations
    const courses = await this._courseRepository.findByStudent(studentId);
    
    console.log(`[ExamService] Found ${courses?.length || 0} enrolled courses for student`);

    if (!courses || courses.length === 0) {
      console.log(`[ExamService] No courses found, returning empty list`);
      return [];
    }

    // Extract unique subject and grade IDs from enrolled courses
    const subjectIds: string[] = [];
    const gradeIds: string[] = [];

    for (const course of courses) {
      const subjectId = (course.subject as unknown as { _id?: string })._id?.toString() || (course.subject as unknown as { toString: () => string }).toString();
      const gradeId = (course.grade as unknown as { _id?: string })._id?.toString() || (course.grade as unknown as { toString: () => string }).toString();

      if (subjectId) console.log(`[ExamService] Course ${course._id} has Subject (ID: ${subjectId})`);
      if (gradeId) console.log(`[ExamService] Course ${course._id} has Grade (ID: ${gradeId})`);

      if (subjectId && !subjectIds.includes(subjectId)) {
        subjectIds.push(subjectId);
      }
      if (gradeId && !gradeIds.includes(gradeId)) {
        gradeIds.push(gradeId);
      }
    }

    console.log(`[ExamService] Extracted Subject IDs:`, subjectIds);
    console.log(`[ExamService] Extracted Grade IDs:`, gradeIds);

    if (subjectIds.length === 0 || gradeIds.length === 0) {
      console.log(`[ExamService] No valid subject/grade IDs extracted`);
      return [];
    }

    // Find exams that match any of the student's subject/grade combinations
    const exams = await this._examRepository.findBySubjectsAndGrades(subjectIds, gradeIds);
    console.log(`[ExamService] Found ${exams.length} matching exams`);

    // Fetch student's existing results to map attempts
    const results = await this._examRepository.findResultsByStudent(studentId);
    console.log(`[ExamService] Found ${results.length} past results for student`);
    
    // Enrich exams with attempt status
    return this._resultEnricher.enrichExamsWithAttempts(exams, results);
  }

  async getExamsByMentor(mentorId: string): Promise<IExam[]> {
    return this._examRepository.findByMentorId(mentorId);
  }

  async updateExam(examId: string, data: UpdateExamDTO): Promise<IExam> {
    const updatedExam = await this._examRepository.updateById(examId, data as unknown as Partial<IExam>);
    if (!updatedExam) {
      throw new AppError("Exam not found", HttpStatusCode.NOT_FOUND);
    }
    return updatedExam;
  }

  async deleteExam(examId: string): Promise<void> {
    await this._examRepository.deleteById(examId);
  }

  async submitExam(data: SubmitExamDTO): Promise<IExamResult> {
    const exam = await this._examRepository.findById(data.examId);
    if (!exam) {
      throw new AppError("Exam not found", HttpStatusCode.NOT_FOUND);
    }

    const student = await this._studentRepo.findById(data.studentId);
    if (!student) throw new AppError("Student not found", HttpStatusCode.NOT_FOUND);
    const isPremiumStudent = student.subscription?.planType === 'premium';

    const gradingResult = this._scoringService.gradeExam(exam, data.answers, isPremiumStudent);

    const resultData: Partial<IExamResult> = {
      studentId: new mongoose.Types.ObjectId(data.studentId) as unknown as mongoose.Types.ObjectId,
      examId: new mongoose.Types.ObjectId(data.examId) as unknown as mongoose.Types.ObjectId,
      score: gradingResult.score,
      totalMarks: isPremiumStudent ? exam.totalMarks : gradingResult.allowedMarks, // If basic, total marks is sum of allowed questions
      status: gradingResult.status, 
      answers: gradingResult.gradedAnswers,
      startedAt: new Date(), 
      submittedAt: new Date(),
    };

    return this._examRepository.createResult(resultData);
  }

  async getStudentResults(studentId: string): Promise<IExamResult[]> {
    return this._examRepository.findResultsByStudent(studentId);
  }

  async getExamResults(examId: string, mentorId: string): Promise<IExamResult[]> {
    const exam = await this._examRepository.findById(examId);
    if (!exam) {
      throw new AppError("Exam not found", HttpStatusCode.NOT_FOUND);
    }
    
    // Verify mentor ownership
    if (exam.mentorId.toString() !== mentorId) {
       throw new AppError("Unauthorized access to exam results", HttpStatusCode.FORBIDDEN);
    }

    return this._examRepository.findResultsByExam(examId);
  }

  async gradeStudentExam(
    resultId: string, 
    mentorId: string, 
    grades: { questionId: string; marks: number; feedback?: string }[]
  ): Promise<IExamResult> {
    const result = await this._examRepository.findResultById(resultId);
    if (!result) {
      throw new AppError("Exam result not found", HttpStatusCode.NOT_FOUND);
    }

    // Access the populated exam to check mentor ownership
    // The result.examId is strictly typed as ObjectId, but populate makes it an object. 
    // Typescript might complain if we don't cast or use 'any' if IExamResult interface isn't flexible enough for population.
    const exam = result.examId as unknown as IExam; 
    
    if (!exam || !exam.mentorId) {
         // Should not happen if data integrity is maintained
         throw new AppError("Associated exam not found", HttpStatusCode.NOT_FOUND);
    }

    if (exam.mentorId.toString() !== mentorId) {
      throw new AppError("Unauthorized to grade this exam", HttpStatusCode.FORBIDDEN);
    }

    // Delegate grading to service
    const regradeResult = this._scoringService.regradeExam(result.answers, grades);

    // Update result
    const finalResult = await this._examRepository.updateResult(resultId, {
      answers: regradeResult.updatedAnswers,
      score: regradeResult.score,
      status: ExamStatus.COMPLETED // Mark as completed (graded)
    });

    return finalResult as IExamResult;
  }
}
