import type { IExam, IQuestion } from "../../models/exam.model";

interface SanitizedOption {
  text: string;
  hint?: string;
}

interface SanitizedQuestion extends Omit<IQuestion, 'options'> {
  options?: SanitizedOption[];
}

export class ExamResponseDTO {
  static toResponse(exam: IExam, isPremium: boolean) {
    const examObj = exam.toObject ? exam.toObject() : exam;

    let questions: IQuestion[] = examObj.questions || [];
    if (!isPremium) {
      questions = questions.filter((q) => !q.isPremium);
    }

    const sanitizedQuestions: SanitizedQuestion[] = questions.map((q) => {
      const sanitizedQ: SanitizedQuestion = { ...q };

      if (q.options) {
        sanitizedQ.options = q.options.map((opt) => {
          const { isCorrect: _isCorrect, ...rest } = opt;
          const sanitizedOpt: SanitizedOption = { ...rest };

          if (!isPremium) {
            delete sanitizedOpt.hint;
          }

          return sanitizedOpt;
        });
      }

      if (!isPremium) {
        delete sanitizedQ.hint;
      }

      return sanitizedQ;
    });

    const totalMarks = isPremium
      ? examObj.totalMarks
      : sanitizedQuestions.reduce((sum: number, q: SanitizedQuestion) => sum + (q.marks || 0), 0);

    return {
      ...examObj,
      questions: sanitizedQuestions,
      totalMarks
    };
  }
}
