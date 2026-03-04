import { injectable } from "inversify";
import type { IExam } from "../../models/exam.model.js";
import type { IExamResult } from "../../models/examResult.model.js";
import type { IEnrichedExam } from "../../interfaces/services/IExamService.js";

@injectable()
export class ExamResultEnricher {

    enrichExamsWithAttempts(exams: IExam[], results: IExamResult[]): IEnrichedExam[] {
        return exams.map(exam => {
            
            const result = results.find(r => {
                
                const resultExamId = (r.examId as any)._id ? (r.examId as any)._id.toString() : r.examId.toString();
                
                return resultExamId === (exam as any)._id.toString();
            });
            
            const status = result ? result.status : null;
      
           
            const examObj = (exam as any).toObject ? (exam as any).toObject() : exam;

            return {
              ...examObj,
              attemptStatus: status,
              resultId: result ? result._id : null
            } as IEnrichedExam;
          });
    }
}
