import { injectable } from "inversify";
import mongoose from "mongoose";
import { QuestionType } from "../../models/exam.model.js";
import type { IExam, IQuestion } from "../../models/exam.model.js";
import type { IAnswer } from "../../models/examResult.model.js";
import { ExamStatus } from "../../models/examResult.model.js";
import type { SubmitAnswerDTO } from "../../dtos/exam/SubmitExamDTO.js";

@injectable()
export class ExamScoringService {

  calculateTotalMarks(questions: IQuestion[]): number {
    return questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  }

  gradeExam(
    exam: IExam, 
    answers: SubmitAnswerDTO[], 
    isPremiumStudent: boolean
  ): { score: number; allowedMarks: number; gradedAnswers: IAnswer[]; status: ExamStatus } {
    
    let totalScore = 0;
    let allowedMarks = 0;

    const gradedAnswers = answers.map((answer) => {
      
      const question = exam.questions.find((q: IQuestion) => 
        
        (q as any)._id.toString() === answer.questionId.toString()
      );
      
      let marksObtained = 0;

      if (question) {
       
        if (!isPremiumStudent && question.isPremium) {
            return null; 
        }

        if (question.type === QuestionType.MCQ && question.options) {
          
          const options = question.options || [];
          const correctOption = options.find((opt) => opt.isCorrect);
          if (
            correctOption &&
            
            (answer.selectedOptionId === (correctOption as any)._id?.toString() ||
             answer.selectedOptionText === correctOption.text)
          ) {
            marksObtained = question.marks;
          }
        }
     

        totalScore += marksObtained;
        allowedMarks += question.marks;
        
        return {
          ...answer,
          questionId: new mongoose.Types.ObjectId(answer.questionId),
          marksObtained,
        } as unknown as IAnswer;
      }
      return null;
    }).filter(a => a !== null) as IAnswer[];

    
    const hasSubjective = exam.questions.some((q) => q.type === QuestionType.SUBJECTIVE);
    const status = hasSubjective ? ExamStatus.PENDING_REVIEW : ExamStatus.COMPLETED;

    return {
        score: totalScore,
        allowedMarks,
        gradedAnswers,
        status
    };
  }

  regradeExam(
    currentAnswers: IAnswer[], 
    grades: { questionId: string; marks: number; feedback?: string }[]
  ): { score: number; updatedAnswers: IAnswer[] } {
    
    
    const gradesMap = new Map(grades.map(g => [g.questionId.toString(), g]));

    
    const updatedAnswers = currentAnswers.map(answer => {
      const qId = answer.questionId.toString();
      const gradeUpdate = gradesMap.get(qId);
      
      if (gradeUpdate) {
        
        const ansObj = (answer as any).toObject ? (answer as any).toObject() : answer;
        
        return {
          ...ansObj,
          marksObtained: gradeUpdate.marks,
          feedback: gradeUpdate.feedback !== undefined ? gradeUpdate.feedback : answer.feedback 
        };
      }
      
      return (answer as any).toObject ? (answer as any).toObject() : answer;
    }) as IAnswer[];

  
    const totalScore = updatedAnswers.reduce((sum, current) => sum + (Number(current.marksObtained) || 0), 0);

    return {
        score: totalScore,
        updatedAnswers
    };
  }
}
