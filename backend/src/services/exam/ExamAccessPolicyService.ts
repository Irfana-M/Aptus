import { injectable } from "inversify";
import type { IExam, IQuestion } from "../../models/exam.model.js";
import type { StudentAuthUser } from "../../interfaces/auth/auth.interface.js";

@injectable()
export class ExamAccessPolicyService {
    
    shouldFilterQuestions(student: StudentAuthUser | null): boolean {
        if (!student) return true; 
        const isPremium = student.subscription?.planType === 'premium';
        return !isPremium;
    }

    filterQuestions(exam: IExam, shouldFilter: boolean): IExam {
        if (!shouldFilter) return exam;

        
        const filteredQuestions = exam.questions.filter(q => !q.isPremium);
        
        exam.questions = filteredQuestions as IQuestion[];
        return exam;
    }

    
    canAttemptQuestion(question: IQuestion, isPremiumStudent: boolean): boolean {
        if (question.isPremium && !isPremiumStudent) {
            return false;
        }
        return true;
    }
}
