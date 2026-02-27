import type { IExam } from "../../models/exam.model";

export class ExamResponseDTO {
  static toResponse(exam: IExam, isPremium: boolean) {

    const examObj = (exam as any).toObject ? (exam as any).toObject() : exam;


    let questions = examObj.questions || [];
    if (!isPremium) {

      questions = questions.filter((q: any) => !q.isPremium);
    }


    const sanitizedQuestions = questions.map((q: any) => {
      const { ...sanitizedQ } = q;


      if (sanitizedQ.options) {

        sanitizedQ.options = sanitizedQ.options.map((opt: any) => {
          const { isCorrect: _isCorrect, ...rest } = opt;


          if (!isPremium) {

            delete (rest as any).hint;
          }

          return rest;
        });
      }


      if (!isPremium) {
        delete sanitizedQ.hint;
      }

      return sanitizedQ;
    });


    const totalMarks = isPremium
      ? examObj.totalMarks

      : sanitizedQuestions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0);

    return {
      ...examObj,
      questions: sanitizedQuestions,
      totalMarks
    };
  }
}
