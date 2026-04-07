import { injectable, inject } from "inversify";
import { TYPES } from "../types";
import type { Request, Response, NextFunction } from "express";
import type { IExamService } from "../interfaces/services/IExamService";
import { HttpStatusCode } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import { ExamResponseDTO } from "../dtos/exam/ExamResponseDTO";
import type { IStudentService } from "../interfaces/services/IStudentService";
import { MESSAGES } from "../constants/messages.constants";
import { UserRole } from "../enums/user.enum";

@injectable()
export class ExamController {
  constructor(
    @inject(TYPES.IExamService) private _examService: IExamService,
    @inject(TYPES.IStudentService) private _studentService: IStudentService
  ) {}

  createExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || req.user.role !== UserRole.MENTOR) {
          // Additional safety check, though middleware should handle this
          throw new AppError(MESSAGES.EXAM.MENTOR_ONLY_CREATE, HttpStatusCode.FORBIDDEN);
      }
      
      const examData = {
          ...req.body,
          mentorId: req.user.id
      };
      
      const exam = await this._examService.createExam(examData);
      return res.status(HttpStatusCode.CREATED).json({
        success: true,
        data: exam,
      });
    } catch (error) {
      next(error);
    }
  };

  getExamsForStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user?.id;
      if (!studentId) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.UNAUTHORIZED);
      
      const exams = await this._examService.getExamsForStudent(studentId);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: exams,
      });
    } catch (error) {
      next(error);
    }
  };
  
  getExamsByMentor = async (req: Request, res: Response, next: NextFunction) => {
    try {
       const mentorId = req.user?.id; 
       if (!mentorId) throw new AppError(MESSAGES.AUTH.USER_NOT_FOUND, HttpStatusCode.UNAUTHORIZED);

       const exams = await this._examService.getExamsByMentor(mentorId);
       return res.status(HttpStatusCode.OK).json({
           success: true,
           data: exams
       });
    } catch (error) {
        next(error);
    }
  };

  getExamById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id || '';
      const role = req.user?.role || '';
      
      const exam = await this._examService.getExamById(id || "", userId, role);
      
      let isPremium = true;
      if (role === UserRole.STUDENT) {
          const student = await this._studentService.getById(userId);
          isPremium = student?.subscription?.planType === 'premium';
      }

      const sanitizedData = ExamResponseDTO.toResponse(exam, isPremium);

      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: sanitizedData,
      });
    } catch (error) {
      next(error);
    }
  };

  submitExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this._examService.submitExam({
        ...req.body,
        studentId: req.user?.id,
      });
      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

    getStudentResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("➡️ [ExamController] getStudentResults hit!");
      const studentId = req.user?.id;
      if (!studentId) throw new AppError(MESSAGES.COMMON.UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED);
      
      const results = await this._examService.getStudentResults(studentId);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: results,
      });
    } catch (error) {
      console.error("Error in getStudentResults controller:", error);
      next(error);
    }
  };

  getExamResults = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { examId } = req.params;
      if (!examId) throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Exam"), HttpStatusCode.BAD_REQUEST);

      const mentorId = req.user?.id;
      if (!mentorId) throw new AppError(MESSAGES.MENTOR.ID_REQUIRED, HttpStatusCode.UNAUTHORIZED);

      const results = await this._examService.getExamResults(examId, mentorId);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: results,
      });
    } catch (error) {
      next(error);
    }
  };

  gradeExam = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resultId } = req.params;
      if (!resultId) throw new AppError(MESSAGES.COMMON.ID_REQUIRED("Result"), HttpStatusCode.BAD_REQUEST);

      const { grades } = req.body; 
      const mentorId = req.user?.id;

      if (!mentorId) throw new AppError(MESSAGES.MENTOR.ID_REQUIRED, HttpStatusCode.UNAUTHORIZED);

      const updatedResult = await this._examService.gradeStudentExam(resultId, mentorId, grades);
      return res.status(HttpStatusCode.OK).json({
        success: true,
        data: updatedResult,
      });
    } catch (error) {
      next(error);
    }
  };
}
